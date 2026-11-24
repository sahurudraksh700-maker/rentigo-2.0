import { SEED_LISTINGS, SEED_REQUESTS, SEED_USERS } from '../data/seedData';
import type {
  Listing,
  ListingReport,
  RentalRequest,
  UserProfile,
} from '../types/rentkaro';

const KEYS = {
  seeded: 'rk_seeded_v1',
  users: 'rk_users_v1',
  listings: 'rk_listings_v1',
  requests: 'rk_requests_v1',
  reports: 'rk_reports_v1',
  sessionUserId: 'rk_session_user_id_v1',
  theme: 'rk_theme_v1',
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function ensureSeeded(): void {
  try {
    if (localStorage.getItem(KEYS.seeded) === '1') return;
    if (!localStorage.getItem(KEYS.users)) writeJson(KEYS.users, SEED_USERS);
    if (!localStorage.getItem(KEYS.listings)) writeJson(KEYS.listings, SEED_LISTINGS);
    if (!localStorage.getItem(KEYS.requests)) writeJson(KEYS.requests, SEED_REQUESTS);
    if (!localStorage.getItem(KEYS.reports)) writeJson(KEYS.reports, []);
    localStorage.setItem(KEYS.seeded, '1');
  } catch {
    // fallback if localStorage disabled
  }
}

export const dbStore = {
  getUsers(): UserProfile[] {
    ensureSeeded();
    return readJson<UserProfile[]>(KEYS.users, SEED_USERS);
  },
  saveUsers(users: UserProfile[]): void {
    writeJson(KEYS.users, users);
  },
  getListings(): Listing[] {
    ensureSeeded();
    return readJson<Listing[]>(KEYS.listings, SEED_LISTINGS);
  },
  saveListings(listings: Listing[]): void {
    writeJson(KEYS.listings, listings);
  },
  getRequests(): RentalRequest[] {
    ensureSeeded();
    return readJson<RentalRequest[]>(KEYS.requests, SEED_REQUESTS);
  },
  saveRequests(requests: RentalRequest[]): void {
    writeJson(KEYS.requests, requests);
  },
  getReports(): ListingReport[] {
    ensureSeeded();
    return readJson<ListingReport[]>(KEYS.reports, []);
  },
  saveReports(reports: ListingReport[]): void {
    writeJson(KEYS.reports, reports);
  },
  getSessionUserId(): string | null {
    try {
      return localStorage.getItem(KEYS.sessionUserId);
    } catch {
      return null;
    }
  },
  setSessionUserId(id: string | null): void {
    try {
      if (id) localStorage.setItem(KEYS.sessionUserId, id);
      else localStorage.removeItem(KEYS.sessionUserId);
    } catch {
      // ignore
    }
  },
  getTheme(): 'light' | 'dark' {
    try {
      const saved = localStorage.getItem(KEYS.theme);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  },
  setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(KEYS.theme, theme);
    } catch {
      // ignore
    }
  },
};
