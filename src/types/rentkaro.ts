export const LISTING_CATEGORIES = [
  'Cameras',
  'Projectors',
  'Formal Wear',
  'Cycles',
  'Books',
  'Electronics',
  'Sports',
  'Other',
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export type ItemCondition = 'New' | 'Good' | 'Fair';

export type RequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'Returned'
  | 'Declined'
  | 'Cancelled';

export interface UserProfile {
  id: string;
  name: string;
  firstName: string;
  email: string;
  college: string;
  phone: string;
  photoUrl: string;
  rating: number;
  reviewCount: number;
  joinedAt: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: ListingCategory;
  photos: string[];
  pricePerDay: number;
  deposit: number;
  condition: ItemCondition;
  pickupLocation: string;
  availableFrom: string; // YYYY-MM-DD
  availableTo: string;   // YYYY-MM-DD
  isPaused: boolean;
  createdAt: string;
}

export interface RentalRequest {
  id: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  days: number;
  pricePerDaySnapshot: number;
  depositSnapshot: number;
  totalAmount: number;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListingReport {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  details: string;
  createdAt: string;
}
