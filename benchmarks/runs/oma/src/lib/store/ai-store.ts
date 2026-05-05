import { create } from 'zustand';
import { AIMessage } from '@/types/world';

interface AIState {
  messages: AIMessage[];
  isOpen: boolean;
  isLoading: boolean;
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,

  addMessage: (message) => {
    const full: AIMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    set({ messages: [...get().messages, full] });
  },

  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set({ isOpen: !get().isOpen }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}));
