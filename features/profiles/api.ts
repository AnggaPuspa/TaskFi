import { supabase, Tables } from '~/utils/supabase';

/**
 * Profiles API functions
 * All functions are user-scoped for security
 */

// Types
interface Profile {
  id: string;
  username?: string;
  avatarUrl?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

type UpdateProfileInput = Partial<Omit<Tables<'profiles'>, 'id' | 'created_at' | 'updated_at'>>;

// Transform Supabase row to our Profile type
const transformProfile = (row: Tables<'profiles'>): Profile => ({
  id: row.id,
  username: row.username || undefined,
  avatarUrl: row.avatar_url || undefined,
  currency: row.currency,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Fetch current user's profile
 */
export async function fetchProfile(userId: string): Promise<Profile> {
  console.log('[fetchProfile] Fetching profile for user:', userId);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[fetchProfile] Error:', error);
    throw new Error(error.message);
  }

  return transformProfile(data);
}

/**
 * Update current user's profile
 */
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  console.log('[updateProfile] Updating profile for user:', userId, input);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...input,
      avatar_url: input.avatar_url !== undefined ? input.avatar_url : undefined,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateProfile] Error:', error);
    throw new Error(error.message);
  }

  console.log('[updateProfile] Updated profile:', data.id);
  return transformProfile(data);
}

/**
 * Create profile for new user (usually called after signup)
 */
export async function createProfile(userId: string, input: Omit<UpdateProfileInput, 'id'>): Promise<Profile> {
  console.log('[createProfile] Creating profile for user:', userId, input);

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...input,
      avatar_url: input.avatar_url !== undefined ? input.avatar_url : undefined,
    })
    .select()
    .single();

  if (error) {
    console.error('[createProfile] Error:', error);
    throw new Error(error.message);
  }

  console.log('[createProfile] Created profile:', data.id);
  return transformProfile(data);
}

/**
 * Delete profile (usually not needed, but for completeness)
 */
export async function deleteProfile(userId: string): Promise<void> {
  console.log('[deleteProfile] Deleting profile for user:', userId);

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('[deleteProfile] Error:', error);
    throw new Error(error.message);
  }

  console.log('[deleteProfile] Deleted profile:', userId);
}
