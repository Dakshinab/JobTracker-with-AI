import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  date: string;
  status: JobStatus;
  notes: string;
  salary: string;
  job_description: string;
  interview_date: string;
  interview_type: string;
  ai_analysis: any;
}

interface JobStore {
  jobs: Job[];
  loading: boolean;
  fetchJobs: () => Promise<void>;
  addJob: (job: Omit<Job, 'id' | 'date'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  loading: false,

  fetchJobs: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) set({ jobs: data as Job[] });
    set({ loading: false });
  },

  addJob: async (job) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newJob = {
      ...job,
      user_id: user.id,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    const { data, error } = await supabase
      .from('jobs')
      .insert(newJob)
      .select()
      .single();
    if (!error && data) {
      set((state) => ({ jobs: [data as Job, ...state.jobs] }));
    }
  },

  updateJob: async (id, updates) => {
    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id);
    if (!error) {
      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
      }));
    }
  },

  deleteJob: async (id) => {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);
    if (!error) {
      set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
    }
  },
}));