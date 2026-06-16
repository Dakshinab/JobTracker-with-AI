import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Experience {
  id: string;
  user_id: string;
  company: string;
  role: string;
  months: number;
  currently_working: boolean;
}

interface ExperienceStore {
  experiences: Experience[];
  fetchExperiences: () => Promise<void>;
  addExperience: (exp: Omit<Experience, 'id' | 'user_id'>) => Promise<void>;
  updateExperience: (id: string, updates: Partial<Experience>) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
}

export function formatDuration(months: number): string {
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = months / 12;
  if (Number.isInteger(years)) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years.toFixed(1)} years`;
}

export const useExperienceStore = create<ExperienceStore>((set) => ({
  experiences: [],

  fetchExperiences: async () => {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) set({ experiences: data as Experience[] });
  },

  addExperience: async (exp) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('experiences')
      .insert({ ...exp, user_id: user.id })
      .select()
      .single();
    if (!error && data) {
      set((state) => ({ experiences: [data as Experience, ...state.experiences] }));
    }
  },

  updateExperience: async (id, updates) => {
    const { error } = await supabase
      .from('experiences')
      .update(updates)
      .eq('id', id);
    if (!error) {
      set((state) => ({
        experiences: state.experiences.map(e => e.id === id ? { ...e, ...updates } : e),
      }));
    }
  },

  deleteExperience: async (id) => {
    const { error } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id);
    if (!error) {
      set((state) => ({ experiences: state.experiences.filter(e => e.id !== id) }));
    }
  },
}));