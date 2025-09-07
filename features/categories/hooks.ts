import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { supabase, Tables } from '~/utils/supabase';
import { useAuth } from '~/features/auth/AuthProvider';
import { queryKeys } from '~/utils/queryClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Modern categories hooks with React Query + Supabase Realtime
 * Industry standard features:
 * - React Query for caching, background sync, offline support
 * - Optimistic updates for instant UI feedback
 * - Realtime subscriptions for live data sync
 * - Proper error handling and loading states
 * - Type-safe throughout
 */

// Types
interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

type CreateCategoryInput = Omit<Tables<'categories'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
type UpdateCategoryInput = Partial<Omit<Tables<'categories'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Transform Supabase row to our Category type
const transformCategory = (row: Tables<'categories'>): Category => ({
  id: row.id,
  name: row.name,
  type: row.type,
  icon: row.icon || undefined,
  color: row.color || undefined,
  budget: row.budget || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Hook options
interface UseCategoriesOptions {
  enabled?: boolean;
  type?: 'income' | 'expense';
}

// Hook return type
interface UseCategoriesReturn {
  // Data
  categories: Category[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  addCategory: (input: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: string, input: UpdateCategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Utils
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { enabled = true, type } = options;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const userId = user?.id;
  const shouldFetch = enabled && isAuthenticated && !!userId;

  // Fetch categories with React Query
  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: type ? queryKeys.categoriesByType(userId!, type) : queryKeys.categoriesList(userId!),
    queryFn: async (): Promise<Category[]> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useCategories] Fetching categories for user:', userId, type ? `(${type})` : '');

      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        console.error('[useCategories] Fetch error:', error);
        throw new Error(error.message);
      }

      const transformedData = data?.map(transformCategory) || [];
      console.log(`[useCategories] Loaded ${transformedData.length} categories`);

      return transformedData;
    },
    enabled: shouldFetch,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Add category mutation with optimistic update
  const addCategoryMutation = useMutation({
    mutationFn: async (input: CreateCategoryInput): Promise<Tables<'categories'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useCategories] Adding category:', input);

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...input,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('[useCategories] Add error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async (newCategory) => {
      if (!userId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categoriesList(userId) });
      if (type) {
        await queryClient.cancelQueries({ queryKey: queryKeys.categoriesByType(userId, type) });
      }

      // Snapshot previous value
      const previousCategories = queryClient.getQueryData<Category[]>(queryKeys.categoriesList(userId));
      const previousCategoriesByType = type ? queryClient.getQueryData<Category[]>(queryKeys.categoriesByType(userId, type)) : undefined;

      // Optimistically update cache
      const optimisticCategory: Category = {
        id: `temp_${Date.now()}_${Math.random()}`,
        ...newCategory,
        icon: newCategory.icon || undefined,
        color: newCategory.color || undefined,
        budget: newCategory.budget || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update main list
      queryClient.setQueryData<Category[]>(
        queryKeys.categoriesList(userId),
        (old = []) => [...old, optimisticCategory].sort((a, b) => a.name.localeCompare(b.name))
      );

      // Update type-specific list if applicable
      if (type && newCategory.type === type) {
        queryClient.setQueryData<Category[]>(
          queryKeys.categoriesByType(userId, type),
          (old = []) => [...old, optimisticCategory].sort((a, b) => a.name.localeCompare(b.name))
        );
      }

      return { previousCategories, previousCategoriesByType, optimisticCategory };
    },
    onError: (err, newCategory, context) => {
      // Rollback on error
      if (context?.previousCategories && userId) {
        queryClient.setQueryData(queryKeys.categoriesList(userId), context.previousCategories);
      }
      if (context?.previousCategoriesByType && type && userId) {
        queryClient.setQueryData(queryKeys.categoriesByType(userId, type), context.previousCategoriesByType);
      }
      console.error('[useCategories] Add category failed:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categoriesList(userId) });
        if (type) {
          queryClient.invalidateQueries({ queryKey: queryKeys.categoriesByType(userId, type) });
        }
      }
    },
  });

  // Update category mutation with optimistic update
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCategoryInput }): Promise<Tables<'categories'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useCategories] Updating category:', id, input);

      const { data, error } = await supabase
        .from('categories')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[useCategories] Update error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async ({ id, input }) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.categoriesList(userId) });
      if (type) {
        await queryClient.cancelQueries({ queryKey: queryKeys.categoriesByType(userId, type) });
      }

      const previousCategories = queryClient.getQueryData<Category[]>(queryKeys.categoriesList(userId));
      const previousCategoriesByType = type ? queryClient.getQueryData<Category[]>(queryKeys.categoriesByType(userId, type)) : undefined;

      // Optimistically update cache
      queryClient.setQueryData<Category[]>(
        queryKeys.categoriesList(userId),
        (old = []) => old.map(category =>
          category.id === id
            ? {
                ...category,
                ...input,
                icon: input.icon !== undefined ? (input.icon || undefined) : category.icon,
                color: input.color !== undefined ? (input.color || undefined) : category.color,
                budget: input.budget !== undefined ? (input.budget || undefined) : category.budget,
                updatedAt: new Date().toISOString(),
              }
            : category
        ).sort((a, b) => a.name.localeCompare(b.name))
      );

      // Update type-specific list if applicable
      if (type) {
        queryClient.setQueryData<Category[]>(
          queryKeys.categoriesByType(userId, type),
          (old = []) => old.map(category =>
            category.id === id
              ? {
                  ...category,
                  ...input,
                  icon: input.icon !== undefined ? (input.icon || undefined) : category.icon,
                  color: input.color !== undefined ? (input.color || undefined) : category.color,
                  budget: input.budget !== undefined ? (input.budget || undefined) : category.budget,
                  updatedAt: new Date().toISOString(),
                }
              : category
          ).sort((a, b) => a.name.localeCompare(b.name))
        );
      }

      return { previousCategories, previousCategoriesByType };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories && userId) {
        queryClient.setQueryData(queryKeys.categoriesList(userId), context.previousCategories);
      }
      if (context?.previousCategoriesByType && type && userId) {
        queryClient.setQueryData(queryKeys.categoriesByType(userId, type), context.previousCategoriesByType);
      }
      console.error('[useCategories] Update category failed:', err);
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categoriesList(userId) });
        if (type) {
          queryClient.invalidateQueries({ queryKey: queryKeys.categoriesByType(userId, type) });
        }
      }
    },
  });

  // Delete category mutation with optimistic update
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useCategories] Deleting category:', id);

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('[useCategories] Delete error:', error);
        throw new Error(error.message);
      }
    },
    onMutate: async (id) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.categoriesList(userId) });
      if (type) {
        await queryClient.cancelQueries({ queryKey: queryKeys.categoriesByType(userId, type) });
      }

      const previousCategories = queryClient.getQueryData<Category[]>(queryKeys.categoriesList(userId));
      const previousCategoriesByType = type ? queryClient.getQueryData<Category[]>(queryKeys.categoriesByType(userId, type)) : undefined;

      // Optimistically remove from cache
      queryClient.setQueryData<Category[]>(
        queryKeys.categoriesList(userId),
        (old = []) => old.filter(category => category.id !== id)
      );

      // Remove from type-specific list if applicable
      if (type) {
        queryClient.setQueryData<Category[]>(
          queryKeys.categoriesByType(userId, type),
          (old = []) => old.filter(category => category.id !== id)
        );
      }

      return { previousCategories, previousCategoriesByType };
    },
    onError: (err, id, context) => {
      if (context?.previousCategories && userId) {
        queryClient.setQueryData(queryKeys.categoriesList(userId), context.previousCategories);
      }
      if (context?.previousCategoriesByType && type && userId) {
        queryClient.setQueryData(queryKeys.categoriesByType(userId, type), context.previousCategoriesByType);
      }
      console.error('[useCategories] Delete category failed:', err);
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categoriesList(userId) });
        if (type) {
          queryClient.invalidateQueries({ queryKey: queryKeys.categoriesByType(userId, type) });
        }
      }
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!shouldFetch) return;

    // Cleanup previous subscription
    if (channelRef.current) {
      console.log('[useCategories] Cleaning up previous realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('[useCategories] Setting up realtime subscription for user:', userId);

    // Create new channel
    const channel = supabase
      .channel(`public:categories:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useCategories] Realtime event:', payload.eventType);

          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({
            queryKey: queryKeys.categoriesList(userId!),
            exact: true,
          });

          // Also invalidate type-specific queries
          queryClient.invalidateQueries({
            queryKey: queryKeys.categoriesByType(userId!, 'income'),
            exact: true,
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.categoriesByType(userId!, 'expense'),
            exact: true,
          });
        }
      )
      .subscribe((status) => {
        console.log('[useCategories] Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useCategories] ✅ Successfully subscribed to realtime changes');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        console.log('[useCategories] Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shouldFetch, userId, queryClient]);

  // Action functions
  const addCategory = useCallback(async (input: CreateCategoryInput): Promise<void> => {
    await addCategoryMutation.mutateAsync(input);
  }, [addCategoryMutation]);

  const updateCategory = useCallback(async (id: string, input: UpdateCategoryInput): Promise<void> => {
    await updateCategoryMutation.mutateAsync({ id, input });
  }, [updateCategoryMutation]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    await deleteCategoryMutation.mutateAsync(id);
  }, [deleteCategoryMutation]);

  const refetchCategories = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  return {
    categories,
    isLoading,
    error: error as Error | null,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: refetchCategories,
    isRefetching,
  };
}
