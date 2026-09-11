import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
                 || import.meta.env.SUPABASE_DATABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
                     || import.meta.env.SUPABASE_ANON_KEY;


export const db = createClient(supabaseUrl, supabaseAnonKey);
export const supabase = db;

export const signInWithEmailAndPassword = async (_auth: unknown, email: string, password: string) => {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const createUserWithEmailAndPassword = async (_auth: unknown, email: string, password: string) => {
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await db.auth.signOut();
  if (error) throw error;
};

export const updateProfile = async (_user: User | null, { displayName }: { displayName: string }) => {
  if (!_user) throw new Error('No authenticated user');
  const { data, error } = await db.auth.updateUser({ data: { full_name: displayName } });
  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, profile: { full_name: string; region: string }) => {
  const { error: authError } = await db.auth.updateUser({ data: { full_name: profile.full_name } });
  if (authError) throw authError;

  const { data, error } = await db
    .from('users')
    .update(profile)
    .eq('id', userId)
    .select('full_name, region')
    .single();
  if (error) throw error;
  return data;
};

export const getCurrentUser = async () => {
  const { data, error } = await db.auth.getSession();
  if (error) {
    if (error.message?.includes('Auth session missing')) {
      return null;
    }
    throw error;
  }
  return data?.session?.user ?? null;
};

export const getSession = async () => {
  const { data, error } = await db.auth.getSession();
  if (error) throw error;
  return data.session;
};
