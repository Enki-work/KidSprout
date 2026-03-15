/**
 * 孩子档案全局状态
 */

import { create } from 'zustand';
import { Child } from '@/types/child';
import * as repo from '@/db/child.repo';

type ChildStore = {
  children: Child[];
  isLoading: boolean;
  error: string | null;
  load: () => void;
  add:    (child: Child) => void;
  update: (child: Child) => void;
  remove: (id: string) => void;
};

export const useChildStore = create<ChildStore>((set) => ({
  children: [],
  isLoading: false,
  error: null,

  load: () => {
    set({ isLoading: true, error: null });
    try {
      const children = repo.getAllChildren();
      set({ children, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: String(e) });
    }
  },

  add: (child) => {
    repo.insertChild(child);
    set(s => ({ children: [...s.children, child] }));
  },

  update: (child) => {
    repo.updateChild(child);
    set(s => ({
      children: s.children.map(c => c.id === child.id ? child : c),
    }));
  },

  remove: (id) => {
    repo.deleteChild(id);
    set(s => ({ children: s.children.filter(c => c.id !== id) }));
  },
}));
