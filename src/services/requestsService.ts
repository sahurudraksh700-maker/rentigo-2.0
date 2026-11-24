import type { RentalRequest, RequestStatus } from '../types/rentkaro';
import { countInclusiveDays, datesOverlap } from '../utils/dates';
import { dbStore } from './storage';

export interface CreateRequestInput {
  listingId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  message: string;
}

export const requestsService = {
  async listAll(): Promise<RentalRequest[]> {
    return dbStore.getRequests();
  },

  async listByRenter(renterId: string): Promise<RentalRequest[]> {
    return dbStore
      .getRequests()
      .filter((r) => r.renterId === renterId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listByOwner(ownerId: string): Promise<RentalRequest[]> {
    return dbStore
      .getRequests()
      .filter((r) => r.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(input: CreateRequestInput): Promise<RentalRequest> {
    const listings = dbStore.getListings();
    const listing = listings.find((l) => l.id === input.listingId);
    if (!listing) throw new Error('Listing no longer exists.');
    if (listing.isPaused) throw new Error('This listing is currently paused by the owner.');
    if (listing.ownerId === input.renterId) {
      throw new Error('You cannot request to rent your own item.');
    }
    if (!input.startDate || !input.endDate) {
      throw new Error('Select both start and end dates.');
    }
    if (input.endDate < input.startDate) {
      throw new Error('End date cannot be earlier than start date.');
    }
    if (input.startDate < listing.availableFrom || input.endDate > listing.availableTo) {
      throw new Error(
        `Dates must fall within the available window (${listing.availableFrom} to ${listing.availableTo}).`,
      );
    }

    const existing = dbStore.getRequests();
    const overlappingAccepted = existing.find(
      (r) =>
        r.listingId === listing.id &&
        r.status === 'Accepted' &&
        datesOverlap(r.startDate, r.endDate, input.startDate, input.endDate),
    );
    if (overlappingAccepted) {
      throw new Error(
        `Those dates overlap an existing confirmed booking (${overlappingAccepted.startDate} to ${overlappingAccepted.endDate}).`,
      );
    }

    const days = countInclusiveDays(input.startDate, input.endDate);
    const totalAmount = days * listing.pricePerDay + listing.deposit;
    const now = new Date().toISOString();

    const created: RentalRequest = {
      id: `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      listingId: listing.id,
      renterId: input.renterId,
      ownerId: listing.ownerId,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      pricePerDaySnapshot: listing.pricePerDay,
      depositSnapshot: listing.deposit,
      totalAmount,
      message: input.message.trim(),
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    dbStore.saveRequests([created, ...existing]);
    return created;
  },

  async updateStatus(
    requestId: string,
    actorId: string,
    nextStatus: RequestStatus,
  ): Promise<RentalRequest> {
    const requests = dbStore.getRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error('Rental request not found.');

    const isOwner = target.ownerId === actorId;
    const isRenter = target.renterId === actorId;

    if (nextStatus === 'Accepted' || nextStatus === 'Declined' || nextStatus === 'Returned') {
      if (!isOwner) throw new Error('Only the item owner can perform this action.');
    }
    if (nextStatus === 'Cancelled') {
      if (!isRenter) throw new Error('Only the renter can cancel this request.');
    }

    // Validate transitions
    if (nextStatus === 'Accepted') {
      if (target.status !== 'Pending') throw new Error('Only pending requests can be accepted.');
      const conflict = requests.find(
        (r) =>
          r.id !== target.id &&
          r.listingId === target.listingId &&
          r.status === 'Accepted' &&
          datesOverlap(r.startDate, r.endDate, target.startDate, target.endDate),
      );
      if (conflict) {
        throw new Error(
          `Cannot accept: overlaps with an already accepted booking (${conflict.startDate} to ${conflict.endDate}).`,
        );
      }
    } else if (nextStatus === 'Declined') {
      if (target.status !== 'Pending') throw new Error('Only pending requests can be declined.');
    } else if (nextStatus === 'Cancelled') {
      if (target.status !== 'Pending') throw new Error('Only pending requests can be cancelled.');
    } else if (nextStatus === 'Returned') {
      if (target.status !== 'Accepted') {
        throw new Error('Only active accepted rentals can be marked as returned.');
      }
    }

    const updated: RentalRequest = {
      ...target,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    dbStore.saveRequests(requests.map((r) => (r.id === requestId ? updated : r)));
    return updated;
  },
};
