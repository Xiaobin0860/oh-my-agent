import { create } from 'zustand';
import { UserProfile } from '@/types/world';

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => {
    set({ profile });
    if (typeof window !== 'undefined') {
      localStorage.setItem('worldie-user', JSON.stringify(profile));
    }
  },
  clearProfile: () => {
    set({ profile: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('worldie-user');
    }
  },
}));
