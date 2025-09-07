import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { supabase, Tables } from '~/utils/supabase';
import { useAuth } from '~/features/auth/AuthProvider';
import { queryKeys } from '~/utils/queryClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Modern profiles hooks with React Query + Supabase Realtime
 * Industry standard features:
 * - React Query for caching, background sync, offline support
 * - Optimistic updates for instant UI feedback
 * - Realtime subscriptions for live data sync
 * - Proper error handling and loading states
 * - Type-safe throughout
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

// Hook options
interface UseProfileOptions {
  enabled?: boolean;
}

// Hook return type
interface UseProfileReturn {
  // Data
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  createProfile: (input: Omit<UpdateProfileInput, 'id'>) => Promise<void>;
  deleteProfile: () => Promise<void>;

  // Utils
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

export function useProfile(options: UseProfileOptions = {}): UseProfileReturn {
  const { enabled = true } = options;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const userId = user?.id;
  const shouldFetch = enabled && isAuthenticated && !!userId;

  // Fetch profile with React Query
  const {
    data: profile,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.profile(userId!),
    queryFn: async (): Promise<Profile> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useProfile] Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[useProfile] Fetch error:', error);
        throw new Error(error.message);
      }

      return transformProfile(data);
    },
    enabled: shouldFetch,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update profile mutation with optimistic update
  const updateProfileMutation = useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<Tables<'profiles'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useProfile] Updating profile:', input);

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
        console.error('[useProfile] Update error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async (input) => {
      if (!userId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.profile(userId) });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<Profile>(queryKeys.profile(userId));

      // Optimistically update cache
      if (previousProfile) {
        queryClient.setQueryData<Profile>(
          queryKeys.profile(userId),
          {
            ...previousProfile,
            ...input,
            username: input.username !== undefined ? (input.username || undefined) : previousProfile.username,
            avatarUrl: input.avatar_url !== undefined ? (input.avatar_url || undefined) : previousProfile.avatarUrl,
            updatedAt: new Date().toISOString(),
          }
        );
      }

      return { previousProfile };
    },
    onError: (err, input, context) => {
      // Rollback on error
      if (context?.previousProfile && userId) {
        queryClient.setQueryData(queryKeys.profile(userId), context.previousProfile);
      }
      console.error('[useProfile] Update profile failed:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      }
    },
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (input: Omit<UpdateProfileInput, 'id'>): Promise<Tables<'profiles'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useProfile] Creating profile:', input);

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
        console.error('[useProfile] Create error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate profile query to refetch
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      }
    },
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useProfile] Deleting profile:', userId);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('[useProfile] Delete error:', error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Remove from cache
      if (userId) {
        queryClient.removeQueries({ queryKey: queryKeys.profile(userId) });
      }
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!shouldFetch) return;

    // Cleanup previous subscription
    if (channelRef.current) {
      console.log('[useProfile] Cleaning up previous realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('[useProfile] Setting up realtime subscription for user:', userId);

    // Create new channel
    const channel = supabase
      .channel(`public:profiles:id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useProfile] Realtime event:', payload.eventType);

          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({
            queryKey: queryKeys.profile(userId!),
            exact: true,
          });
        }
      )
      .subscribe((status) => {
        console.log('[useProfile] Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useProfile] ✅ Successfully subscribed to realtime changes');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        console.log('[useProfile] Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shouldFetch, userId, queryClient]);

  // Action functions
  const updateProfileAction = useCallback(async (input: UpdateProfileInput): Promise<void> => {
    await updateProfileMutation.mutateAsync(input);
  }, [updateProfileMutation]);

  const createProfileAction = useCallback(async (input: Omit<UpdateProfileInput, 'id'>): Promise<void> => {
    await createProfileMutation.mutateAsync(input);
  }, [createProfileMutation]);

  const deleteProfileAction = useCallback(async (): Promise<void> => {
    await deleteProfileMutation.mutateAsync();
  }, [deleteProfileMutation]);

  const refetchProfile = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  return {
    profile: profile || null,
    isLoading,
    error: error as Error | null,
    updateProfile: updateProfileAction,
    createProfile: createProfileAction,
    deleteProfile: deleteProfileAction,
    refetch: refetchProfile,
    isRefetching,
  };
}
