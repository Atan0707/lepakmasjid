import { pb } from '../pocketbase';
import type { User } from '@/types';

export const usersApi = {
  // List users (admin only)
  async list(): Promise<User[]> {
    const result = await pb.collection('users').getList(1, 100, {
      sort: '-created',
    });
    return result.items as unknown as User[];
  },

  // Get single user
  async get(id: string): Promise<User> {
    return await pb.collection('users').getOne(id) as unknown as User;
  },

  // Update user
  async update(id: string, data: Partial<User>): Promise<User> {
    return await pb.collection('users').update(id, data) as unknown as User;
  },

  // Update current user profile (name, email)
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    if (!pb.authStore.model) {
      throw new Error('User not authenticated');
    }
    return await pb.collection('users').update(pb.authStore.model.id, data) as unknown as User;
  },

  // Update current user password
  async updatePassword(oldPassword: string, newPassword: string, passwordConfirm: string): Promise<void> {
    if (!pb.authStore.model) {
      throw new Error('User not authenticated');
    }
    // First verify old password by attempting to re-authenticate
    try {
      await pb.collection('users').authWithPassword(pb.authStore.model.email, oldPassword);
    } catch (error) {
      throw new Error('Current password is incorrect');
    }
    // Update password
    await pb.collection('users').update(pb.authStore.model.id, {
      password: newPassword,
      passwordConfirm: passwordConfirm,
    });
  },

  // Request password reset (sends email)
  async requestPasswordReset(email: string): Promise<void> {
    await pb.collection('users').requestPasswordReset(email);
  },

  // Ban user (set verified to false or add banned flag)
  async ban(id: string): Promise<User> {
    return await this.update(id, { verified: false });
  },

  // Unban user
  async unban(id: string): Promise<User> {
    return await this.update(id, { verified: true });
  },
};

