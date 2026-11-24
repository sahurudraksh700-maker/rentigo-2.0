import type { UserProfile } from '../types/rentkaro';
import { dbStore } from './storage';

export const usersService = {
  async listUsers(): Promise<UserProfile[]> {
    return dbStore.getUsers();
  },

  async getById(id: string): Promise<UserProfile | null> {
    const users = dbStore.getUsers();
    return users.find((u) => u.id === id) ?? null;
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const id = dbStore.getSessionUserId();
    if (!id) return null;
    return this.getById(id);
  },

  async signInWithGooglePreset(userId: string): Promise<UserProfile> {
    const users = dbStore.getUsers();
    const found = users.find((u) => u.id === userId);
    if (!found) throw new Error('Account not found.');
    dbStore.setSessionUserId(found.id);
    return found;
  },

  async signInWithGoogleCustom(input: {
    name: string;
    email: string;
    college: string;
    phone: string;
  }): Promise<UserProfile> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const college = input.college.trim();
    const phone = input.phone.trim();

    if (!name || !email.includes('@') || !college || !phone) {
      throw new Error('Please complete your name, email, college, and WhatsApp number.');
    }

    const users = dbStore.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      const updated: UserProfile = {
        ...existing,
        name,
        firstName: name.split(/\s+/)[0] || name,
        college,
        phone,
      };
      dbStore.saveUsers(users.map((u) => (u.id === existing.id ? updated : u)));
      dbStore.setSessionUserId(updated.id);
      return updated;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now().toString(36)}`,
      name,
      firstName: name.split(/\s+/)[0] || name,
      email,
      college,
      phone,
      photoUrl: '',
      rating: 5.0,
      reviewCount: 0,
      joinedAt: new Date().toISOString(),
    };
    dbStore.saveUsers([newUser, ...users]);
    dbStore.setSessionUserId(newUser.id);
    return newUser;
  },

  async updateProfile(
    userId: string,
    patch: Partial<Pick<UserProfile, 'name' | 'college' | 'phone' | 'photoUrl'>>,
  ): Promise<UserProfile> {
    const users = dbStore.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error('User profile not found.');

    const nextName = (patch.name ?? target.name).trim();
    const updated: UserProfile = {
      ...target,
      ...patch,
      name: nextName,
      firstName: nextName.split(/\s+/)[0] || nextName,
    };
    dbStore.saveUsers(users.map((u) => (u.id === userId ? updated : u)));
    return updated;
  },

  async signOut(): Promise<void> {
    dbStore.setSessionUserId(null);
  },
};
