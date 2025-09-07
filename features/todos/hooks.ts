import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { supabase, Tables } from '~/utils/supabase';
import { useAuth } from '~/features/auth/AuthProvider';
import { queryKeys } from '~/utils/queryClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Modern todos hooks with React Query + Supabase Realtime
 * Industry standard features:
 * - React Query for caching, background sync, offline support
 * - Optimistic updates for instant UI feedback
 * - Realtime subscriptions for live data sync
 * - Proper error handling and loading states
 * - Type-safe throughout
 */

// Types
interface Todo {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  due?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

type CreateTodoInput = Omit<Tables<'todos'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
type UpdateTodoInput = Partial<Omit<Tables<'todos'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Transform Supabase row to our Todo type
const transformTodo = (row: Tables<'todos'>): Todo => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  done: row.done,
  priority: row.priority,
  due: row.due || undefined,
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Hook options
interface UseTodosOptions {
  enabled?: boolean;
}

// Hook return type
interface UseTodosReturn {
  // Data
  todos: Todo[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  addTodo: (input: CreateTodoInput) => Promise<void>;
  updateTodo: (id: string, input: UpdateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;

  // Utils
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

export function useTodos(options: UseTodosOptions = {}): UseTodosReturn {
  const { enabled = true } = options;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const userId = user?.id;
  const shouldFetch = enabled && isAuthenticated && !!userId;

  // Fetch todos with React Query
  const {
    data: todos = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.todosList(userId!),
    queryFn: async (): Promise<Todo[]> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTodos] Fetching todos for user:', userId);

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useTodos] Fetch error:', error);
        throw new Error(error.message);
      }

      const transformedData = data?.map(transformTodo) || [];
      console.log(`[useTodos] Loaded ${transformedData.length} todos`);

      return transformedData;
    },
    enabled: shouldFetch,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Add todo mutation with optimistic update
  const addTodoMutation = useMutation({
    mutationFn: async (input: CreateTodoInput): Promise<Tables<'todos'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTodos] Adding todo:', input);

      const { data, error } = await supabase
        .from('todos')
        .insert({
          ...input,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('[useTodos] Add error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async (newTodo) => {
      if (!userId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.todosList(userId) });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKeys.todosList(userId));

      // Optimistically update cache
      const optimisticTodo: Todo = {
        id: `temp_${Date.now()}_${Math.random()}`,
        ...newTodo,
        description: newTodo.description || undefined,
        due: newTodo.due || undefined,
        tags: newTodo.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Todo[]>(
        queryKeys.todosList(userId),
        (old = []) => [optimisticTodo, ...old]
      );

      return { previousTodos, optimisticTodo };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      if (context?.previousTodos && userId) {
        queryClient.setQueryData(queryKeys.todosList(userId), context.previousTodos);
      }
      console.error('[useTodos] Add todo failed:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.todosList(userId) });
      }
    },
  });

  // Update todo mutation with optimistic update
  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTodoInput }): Promise<Tables<'todos'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTodos] Updating todo:', id, input);

      const { data, error } = await supabase
        .from('todos')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[useTodos] Update error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async ({ id, input }) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.todosList(userId) });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKeys.todosList(userId));

      // Optimistically update cache
      queryClient.setQueryData<Todo[]>(
        queryKeys.todosList(userId),
        (old = []) => old.map(todo =>
          todo.id === id
            ? {
                ...todo,
                ...input,
                description: input.description !== undefined ? (input.description || undefined) : todo.description,
                due: input.due !== undefined ? (input.due || undefined) : todo.due,
                tags: input.tags !== undefined ? (input.tags || []) : todo.tags,
                updatedAt: new Date().toISOString(),
              }
            : todo
        )
      );

      return { previousTodos };
    },
    onError: (err, variables, context) => {
      if (context?.previousTodos && userId) {
        queryClient.setQueryData(queryKeys.todosList(userId), context.previousTodos);
      }
      console.error('[useTodos] Update todo failed:', err);
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.todosList(userId) });
      }
    },
  });

  // Delete todo mutation with optimistic update
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTodos] Deleting todo:', id);

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('[useTodos] Delete error:', error);
        throw new Error(error.message);
      }
    },
    onMutate: async (id) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.todosList(userId) });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKeys.todosList(userId));

      // Optimistically remove from cache
      queryClient.setQueryData<Todo[]>(
        queryKeys.todosList(userId),
        (old = []) => old.filter(todo => todo.id !== id)
      );

      return { previousTodos };
    },
    onError: (err, id, context) => {
      if (context?.previousTodos && userId) {
        queryClient.setQueryData(queryKeys.todosList(userId), context.previousTodos);
      }
      console.error('[useTodos] Delete todo failed:', err);
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.todosList(userId) });
      }
    },
  });

  // Toggle todo mutation
  const toggleTodoMutation = useMutation({
    mutationFn: async (id: string): Promise<Tables<'todos'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTodos] Toggling todo:', id);

      const { data, error } = await supabase
        .from('todos')
        .update({ done: !todos.find(t => t.id === id)?.done })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[useTodos] Toggle error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async (id) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.todosList(userId) });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKeys.todosList(userId));

      // Optimistically toggle in cache
      queryClient.setQueryData<Todo[]>(
        queryKeys.todosList(userId),
        (old = []) => old.map(todo =>
          todo.id === id
            ? { ...todo, done: !todo.done, updatedAt: new Date().toISOString() }
            : todo
        )
      );

      return { previousTodos };
    },
    onError: (err, id, context) => {
      if (context?.previousTodos && userId) {
        queryClient.setQueryData(queryKeys.todosList(userId), context.previousTodos);
      }
      console.error('[useTodos] Toggle todo failed:', err);
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.todosList(userId) });
      }
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!shouldFetch) return;

    // Cleanup previous subscription
    if (channelRef.current) {
      console.log('[useTodos] Cleaning up previous realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('[useTodos] Setting up realtime subscription for user:', userId);

    // Create new channel
    const channel = supabase
      .channel(`public:todos:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useTodos] Realtime event:', payload.eventType);

          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({
            queryKey: queryKeys.todosList(userId!),
            exact: true,
          });
        }
      )
      .subscribe((status) => {
        console.log('[useTodos] Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useTodos] ✅ Successfully subscribed to realtime changes');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        console.log('[useTodos] Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shouldFetch, userId, queryClient]);

  // Action functions
  const addTodo = useCallback(async (input: CreateTodoInput): Promise<void> => {
    await addTodoMutation.mutateAsync(input);
  }, [addTodoMutation]);

  const updateTodo = useCallback(async (id: string, input: UpdateTodoInput): Promise<void> => {
    await updateTodoMutation.mutateAsync({ id, input });
  }, [updateTodoMutation]);

  const deleteTodo = useCallback(async (id: string): Promise<void> => {
    await deleteTodoMutation.mutateAsync(id);
  }, [deleteTodoMutation]);

  const toggleTodo = useCallback(async (id: string): Promise<void> => {
    await toggleTodoMutation.mutateAsync(id);
  }, [toggleTodoMutation]);

  const refetchTodos = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  return {
    todos,
    isLoading,
    error: error as Error | null,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refetch: refetchTodos,
    isRefetching,
  };
}