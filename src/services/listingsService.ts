import type {
  ItemCondition,
  Listing,
  ListingCategory,
  ListingReport,
} from '../types/rentkaro';
import { expandDateRange, todayIsoDate } from '../utils/dates';
import { dbStore } from './storage';

export interface ListingInput {
  ownerId: string;
  title: string;
  description: string;
  category: ListingCategory;
  photos: string[];
  pricePerDay: number;
  deposit: number;
  condition: ItemCondition;
  pickupLocation: string;
  availableFrom: string;
  availableTo: string;
}

export const listingsService = {
  async listAll(): Promise<Listing[]> {
    return dbStore.getListings();
  },

  async getById(id: string): Promise<Listing | null> {
    const items = dbStore.getListings();
    return items.find((item) => item.id === id) ?? null;
  },

  async listByOwner(ownerId: string): Promise<Listing[]> {
    return dbStore.getListings().filter((item) => item.ownerId === ownerId);
  },

  async create(input: ListingInput): Promise<Listing> {
    const newItem: Listing = {
      id: `lst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      ownerId: input.ownerId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      photos: input.photos.slice(0, 4),
      pricePerDay: Math.round(Number(input.pricePerDay)),
      deposit: Math.round(Number(input.deposit)),
      condition: input.condition,
      pickupLocation: input.pickupLocation.trim(),
      availableFrom: input.availableFrom,
      availableTo: input.availableTo,
      isPaused: false,
      createdAt: new Date().toISOString(),
    };
    const items = dbStore.getListings();
    dbStore.saveListings([newItem, ...items]);
    return newItem;
  },

  async update(
    id: string,
    ownerId: string,
    patch: Partial<Omit<ListingInput, 'ownerId'>> & { isPaused?: boolean },
  ): Promise<Listing> {
    const items = dbStore.getListings();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error('Listing not found.');
    if (existing.ownerId !== ownerId) {
      throw new Error('Only the owner can modify this listing.');
    }
    const updated: Listing = {
      ...existing,
      ...patch,
      title: (patch.title ?? existing.title).trim(),
      description: (patch.description ?? existing.description).trim(),
      pickupLocation: (patch.pickupLocation ?? existing.pickupLocation).trim(),
      photos: patch.photos ? patch.photos.slice(0, 4) : existing.photos,
      pricePerDay:
        patch.pricePerDay !== undefined
          ? Math.round(Number(patch.pricePerDay))
          : existing.pricePerDay,
      deposit:
        patch.deposit !== undefined
          ? Math.round(Number(patch.deposit))
          : existing.deposit,
    };
    dbStore.saveListings(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  },

  async togglePause(id: string, ownerId: string): Promise<Listing> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Listing not found.');
    return this.update(id, ownerId, { isPaused: !existing.isPaused });
  },

  async remove(id: string, ownerId: string): Promise<void> {
    const items = dbStore.getListings();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error('Listing not found.');
    if (existing.ownerId !== ownerId) {
      throw new Error('Only the owner can delete this listing.');
    }
    dbStore.saveListings(items.filter((item) => item.id !== id));
  },

  getBookedDatesSync(listingId: string): string[] {
    const requests = dbStore.getRequests();
    const booked = new Set<string>();
    for (const req of requests) {
      if (req.listingId === listingId && req.status === 'Accepted') {
        for (const day of expandDateRange(req.startDate, req.endDate)) {
          booked.add(day);
        }
      }
    }
    return Array.from(booked).sort();
  },

  isRentedTodaySync(listingId: string): boolean {
    const today = todayIsoDate();
    const booked = this.getBookedDatesSync(listingId);
    return booked.includes(today);
  },

  async reportListing(input: {
    listingId: string;
    reporterId: string;
    reason: string;
    details: string;
  }): Promise<ListingReport> {
    const report: ListingReport = {
      id: `rep_${Date.now().toString(36)}`,
      listingId: input.listingId,
      reporterId: input.reporterId,
      reason: input.reason,
      details: input.details.trim(),
      createdAt: new Date().toISOString(),
    };
    const reports = dbStore.getReports();
    dbStore.saveReports([report, ...reports]);
    return report;
  },
};
