import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, Tables } from '../../utils/supabase';
import { useSession } from '../../utils/ctx';
import { Todo } from '../types';
import { applyChange } from '../utils/applyChange';
import { createStableChannel, type RTBinding } from '../../utils/realtime';
import { mockTodos } from '../mocks/todos';

// Development logging counters
let fetchCounter = 0;
let subscriptionCounter = 0;

function logFetch(operation: string, details?: any) {
  if (__DEV__) {
    fetchCounter++;
    console.log(`[Network #${fetchCounter}] ${operation}`, details || '');
  }
}

function logSubscription(operation: string, details?: any) {
  if (__DEV__) {
    subscriptionCounter++;
    console.log(`[Subscription #${subscriptionCounter}] ${operation}`, details || '');
  }
}

// Hook options interface
interface UseTodosOptions {
  enabled?: boolean;
  userId?: string;
}

// Hook return interface
interface UseTodosReturn {
  rows: Todo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  add: (input: Omit<Tables<'todos'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  update: (id: string, patch: Partial<Tables<'todos'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
}

/**
 * Real-time todos hook with optimistic updates
 * Provides instant UI feedback and sync via Supabase Realtime
 * Implements fetch-once + realtime pattern with throttling
 */
export function useTodos(options: UseTodosOptions = {}): UseTodosReturn {
  const { enabled = true, userId: providedUserId } = options;
  const { session } = useSession();
  const userId = providedUserId || session?.user?.id;
  
  // State management
  const [rows, setRows] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Realtime subscription ref
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Track last fetch time to prevent rapid refetches
  const lastFetchRef = useRef<number>(0);
  
  // Stable filter to avoid re-renders
  const filter = useMemo(() => (userId ? `user_id=eq.${userId}` : null), [userId]);

  // Helper function to transform Supabase row to our Todo type
  const transformTodo = useCallback((row: Tables<'todos'>): Todo => ({
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    done: row.done,
    priority: row.priority,
    due: row.due || undefined,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }), []);

  // Fetch todos from database with throttling
  const fetchOnce = useCallback(async () => {
    if (!enabled || !filter || !userId) {
      console.log('useTodos: Skipping fetch - not enabled, no filter, or no userId');
      return;
    }
    
    // Throttle (avoid burst refetch)
    const now = Date.now();
    if (now - lastFetchRef.current < 400) {
      console.log('useTodos: Skipping fetch - throttled');
      return;
    }
    lastFetchRef.current = now;

    try {
      setLoading(true);
      setError(null);
      
      logFetch('Fetching todos', { userId });
      
      const { data: rows, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('useTodos: Fetch error:', fetchError);
        
        // In development, fallback to mock data if Supabase fails
        if (__DEV__) {
          console.log('🔄 Using mock todos as fallback in development');
          // Mock todos are already in the right format
          const todos = mockTodos;
          logFetch(`Loaded ${todos.length} mock todos (fallback)`);
          setRows(todos);
          setError(null);
          return;
        }
        
        throw fetchError;
      }
      
      const todos = rows?.map(transformTodo) || [];
      logFetch(`Loaded ${todos.length} todos for user ${userId}`);
      setRows(todos);
      setError(null);
      
    } catch (err: any) {
      console.error('useTodos: Error fetching todos:', err);
      
      // In development, fallback to mock data if all else fails
      if (__DEV__ && rows.length === 0) {
        console.log('🔄 Using mock todos as final fallback in development');
        // Mock todos are already in the right format
        const todos = mockTodos;
        setRows(todos);
        setError(null);
      } else {
        setError(err?.message || 'Failed to fetch todos');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, filter, userId, transformTodo]);

  // Refetch function for pull-to-refresh
  const refetch = useCallback(async () => {
    console.log('useTodos: Manual refetch requested');
    await fetchOnce();
  }, [fetchOnce]);

  // Optimistic add with rollback on error
  const add = useCallback(async (input: Omit<Tables<'todos'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!enabled || !userId) {
      throw new Error('Not enabled or no user ID');
    }

    // Create optimistic todo with a unique temporary ID
    const optimisticTodo: Todo = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      description: input.description || undefined,
      due: input.due || undefined,
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('useTodos: Adding todo (optimistic):', optimisticTodo.id, input.title);

    // Apply optimistic update immediately
    setRows(prev => [optimisticTodo, ...prev]);

    try {
      const { data: newTodo, error: insertError } = await supabase
        .from('todos')
        .insert({
          ...input,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('useTodos: Insert error:', insertError);
        throw insertError;
      }

      console.log('useTodos: Todo added successfully:', newTodo.id);

      // Replace optimistic todo with real one
      // The realtime subscription will handle this, but we do it here for immediate consistency
      const realTodo = transformTodo(newTodo);
      setRows(prev => prev.map(t => 
        t.id === optimisticTodo.id ? realTodo : t
      ));
      
    } catch (err: any) {
      console.error('useTodos: Error adding todo:', err);
      
      // Rollback optimistic update
      setRows(prev => prev.filter(t => t.id !== optimisticTodo.id));
      
      throw new Error(err?.message || 'Failed to add todo');
    }
  }, [enabled, userId, transformTodo]);

  // Optimistic update with rollback on error
  const update = useCallback(async (id: string, patch: Partial<Tables<'todos'>>) => {
    if (!enabled || !userId) {
      throw new Error('Not enabled or no user ID');
    }

    // Store original for rollback
    const originalTodo = rows.find(t => t.id === id);
    if (!originalTodo) {
      throw new Error('Todo not found');
    }

    // Apply optimistic update immediately
    const updatedTodo: Todo = {
      ...originalTodo,
      ...patch,
      description: patch.description !== undefined ? (patch.description || undefined) : originalTodo.description,
      due: patch.due !== undefined ? (patch.due || undefined) : originalTodo.due,
      tags: patch.tags !== undefined ? (patch.tags || []) : originalTodo.tags,
      updatedAt: new Date().toISOString(),
    };
    
    setRows(prev => prev.map(t => t.id === id ? updatedTodo : t));

    try {
      console.log('useTodos: Updating todo:', id, patch);
      
      const { error: updateError } = await supabase
        .from('todos')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('useTodos: Update error:', updateError);
        throw updateError;
      }

      console.log('useTodos: Todo updated successfully:', id);
      
    } catch (err: any) {
      console.error('useTodos: Error updating todo:', err);
      
      // Rollback optimistic update
      setRows(prev => prev.map(t => t.id === id ? originalTodo : t));
      
      throw new Error(err?.message || 'Failed to update todo');
    }
  }, [enabled, userId, rows]);

  // Optimistic remove with rollback on error
  const remove = useCallback(async (id: string) => {
    if (!enabled || !userId) {
      throw new Error('Not enabled or no user ID');
    }

    // Store original for rollback
    const originalTodo = rows.find(t => t.id === id);
    if (!originalTodo) {
      throw new Error('Todo not found');
    }

    // Apply optimistic update immediately
    setRows(prev => prev.filter(t => t.id !== id));

    try {
      console.log('useTodos: Deleting todo:', id);
      
      const { error: deleteError } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('useTodos: Delete error:', deleteError);
        throw deleteError;
      }

      console.log('useTodos: Todo deleted successfully:', id);
      
    } catch (err: any) {
      console.error('useTodos: Error deleting todo:', err);
      
      // Rollback optimistic update
      setRows(prev => {
        const index = prev.findIndex(t => t.createdAt > originalTodo.createdAt);
        if (index === -1) {
          return [...prev, originalTodo];
        }
        return [...prev.slice(0, index), originalTodo, ...prev.slice(index)];
      });
      
      throw new Error(err?.message || 'Failed to delete todo');
    }
  }, [enabled, userId, rows]);

  // Optimistic toggle with rollback on error
  const toggle = useCallback(async (id: string) => {
    const currentTodo = rows.find(t => t.id === id);
    if (!currentTodo) {
      throw new Error('Todo not found');
    }

    await update(id, { done: !currentTodo.done });
  }, [rows, update]);

  // Setup realtime subscription with stable channel pattern
  useEffect(() => {
    // Initial fetch when hook mounts or user changes
    if (enabled && filter) {
      fetchOnce();
    }

    // Cleanup previous subscription if exists
    if (channelRef.current) {
      console.log('useTodos: Cleaning up previous subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Only subscribe if enabled and userId is available
    if (!enabled || !filter) {
      console.log('useTodos: Skipping subscription - not enabled or no userId');
      return;
    }

    console.log('useTodos: Setting up stable realtime subscription for user:', userId);

    // Create stable channel with fixed bindings
    const bindings: RTBinding[] = [
      { event: '*', schema: 'public', table: 'todos', filter },
    ];

    const channel = createStableChannel(`public:todos:${userId}`, bindings, (payload) => {
      logSubscription(`Realtime event: ${payload.eventType}`, (payload.new as any)?.id || (payload.old as any)?.id);
      
      try {
        const transformedPayload = {
          eventType: payload.eventType,
          new: payload.new ? transformTodo(payload.new as Tables<'todos'>) : undefined,
          old: payload.old && 'id' in payload.old ? { id: payload.old.id } : undefined,
        };

        // Handle realtime events more intelligently
        setRows(prev => {
          // For INSERT events, check if we already have this item (prevent duplicates)
          if (payload.eventType === 'INSERT' && payload.new) {
            const existingItem = prev.find(item => item.id === payload.new.id);
            if (existingItem) {
              console.log('🔄 Realtime INSERT: Replacing optimistic item with real data');
              // Replace optimistic item with real data
              return prev.map(item => 
                item.id === payload.new.id ? transformedPayload.new! : item
              );
            }
          }

          // Apply the change normally
          return applyChange(prev, transformedPayload);
        });
        
      } catch (err) {
        console.error('useTodos: Error processing realtime event:', err);
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      logSubscription(`Channel status: ${status}`);
      if (status === 'SUBSCRIBED') {
        logSubscription('✅ Successfully subscribed to realtime changes');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ useTodos: Failed to subscribe to realtime changes');
        logSubscription('❌ Failed to subscribe to realtime changes');
      } else if (status === 'TIMED_OUT') {
        console.error('❌ useTodos: Subscription timed out');
        logSubscription('❌ Subscription timed out');
      } else if (status === 'CLOSED') {
        logSubscription('🔌 Realtime subscription closed');
      }
    });

    // Store channel reference
    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('useTodos: Cleaning up realtime subscription');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [enabled, filter, transformTodo, fetchOnce, userId]);

  return {
    rows,
    loading,
    error,
    refetch,
    add,
    update,
    remove,
    toggle,
  };
}