import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, Tables } from '../../utils/supabase';
import { useSession } from '../../utils/ctx';
import { Transaction } from '../types';
import { applyChange } from '../utils/applyChange';
import { createStableChannel, type RTBinding } from '../../utils/realtime';
import { mockTransactions } from '../mocks/transactions';

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
interface UseTransactionsOptions {
  enabled?: boolean;
  userId?: string;
}

// Hook return interface
interface UseTransactionsReturn {
  rows: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  add: (input: Omit<Tables<'transactions'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  update: (id: string, patch: Partial<Tables<'transactions'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Real-time transactions hook with optimistic updates
 * Provides instant UI feedback and sync via Supabase Realtime
 * Implements fetch-once + realtime pattern with throttling
 */
export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { enabled = true, userId: providedUserId } = options;
  const { session } = useSession();
  const userId = providedUserId || session?.user?.id;
  
  // State management
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Realtime subscription ref
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Track last fetch time to prevent rapid refetches
  const lastFetchRef = useRef<number>(0);
  
  // Stable filter to avoid re-renders
  const filter = useMemo(() => (userId ? `user_id=eq.${userId}` : null), [userId]);

  // Helper function to transform Supabase row to our Transaction type
  const transformTransaction = useCallback((row: Tables<'transactions'>): Transaction => ({
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    note: row.note || undefined,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) || 0 : (row.amount || 0),
    date: row.date,
    wallet: row.wallet || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }), []);

  // Fetch transactions from database with throttling
  const fetchOnce = useCallback(async () => {
    if (!enabled || !filter) return;
    
    // Throttle (avoid burst refetch)
    const now = Date.now();
    if (now - lastFetchRef.current < 400) return;
    lastFetchRef.current = now;

    try {
      setLoading(true);
      setError(null);
      
      logFetch('Fetching transactions', { userId });
      
      const { data: rows, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId!)
        .order('date', { ascending: false });
      
      if (fetchError) {
        console.error('useTransactions: Fetch error:', fetchError);
        
        // In development, fallback to mock data if Supabase fails
        if (__DEV__) {
          console.log('🔄 Using mock data as fallback in development');
          // Mock transactions are already in the right format
          const transactions = mockTransactions;
          logFetch(`Loaded ${transactions.length} mock transactions (fallback)`);
          setRows(transactions);
          return;
        }
        
        throw fetchError;
      }
      
      const transactions = rows?.map(transformTransaction) || [];
      logFetch(`Loaded ${transactions.length} transactions`);
      setRows(transactions);
      
    } catch (err: any) {
      console.error('useTransactions: Error fetching transactions:', err);
      
      // In development, fallback to mock data if all else fails
      if (__DEV__ && rows.length === 0) {
        console.log('🔄 Using mock data as final fallback in development');
        // Mock transactions are already in the right format
        const transactions = mockTransactions;
        setRows(transactions);
        setError(null);
      } else {
        setError(err?.message || 'Failed to fetch transactions');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, filter, userId, transformTransaction]);

  // Refetch function for pull-to-refresh
  const refetch = useCallback(async () => {
    await fetchOnce();
  }, [fetchOnce]);

  // Optimistic add with rollback on error
  const add = useCallback(async (input: Omit<Tables<'transactions'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!enabled || !userId) {
      throw new Error('Not enabled or no user ID');
    }

    // Create optimistic transaction
    const optimisticTransaction: Transaction = {
      id: `temp_${Date.now()}_${Math.random()}`,
      ...input,
      note: input.note || undefined,
      wallet: input.wallet || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Apply optimistic update immediately
    setRows(prev => [optimisticTransaction, ...prev]);

    try {
      console.log('useTransactions: Adding transaction:', input);
      
      const { data: newTransaction, error: insertError } = await supabase
        .from('transactions')
        .insert({
          ...input,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('useTransactions: Insert error:', insertError);
        throw insertError;
      }

      // Replace optimistic transaction with real one immediately 
      // Don't rely only on realtime for critical UI updates
      const realTransaction = transformTransaction(newTransaction);
      setRows(prev => prev.map(t => t.id === optimisticTransaction.id ? realTransaction : t));
      
      console.log('useTransactions: Transaction added successfully:', newTransaction.id);
      
    } catch (err: any) {
      console.error('useTransactions: Error adding transaction:', err);
      
      // Rollback optimistic update
      setRows(prev => prev.filter(t => t.id !== optimisticTransaction.id));
      
      throw new Error(err?.message || 'Failed to add transaction');
    }
  }, [enabled, userId]);

  // Optimistic update with rollback on error
  const update = useCallback(async (id: string, patch: Partial<Tables<'transactions'>>) => {
    if (!enabled || !userId) {
      throw new Error('Not enabled or no user ID');
    }

    // Store original for rollback
    const originalTransaction = rows.find(t => t.id === id);
    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }

    // Apply optimistic update immediately
    const updatedTransaction: Transaction = {
      ...originalTransaction,
      ...patch,
      note: patch.note !== undefined ? (patch.note || undefined) : originalTransaction.note,
      wallet: patch.wallet !== undefined ? (patch.wallet || undefined) : originalTransaction.wallet,
      updatedAt: new Date().toISOString(),
    };
    
    setRows(prev => prev.map(t => t.id === id ? updatedTransaction : t));

    try {
      console.log('useTransactions: Updating transaction:', id, patch);
      
      const { error: updateError } = await supabase
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('useTransactions: Update error:', updateError);
        throw updateError;
      }

      console.log('useTransactions: Transaction updated successfully:', id);
      
    } catch (err: any) {
      console.error('useTransactions: Error updating transaction:', err);
      
      // Rollback optimistic update
      setRows(prev => prev.map(t => t.id === id ? originalTransaction : t));
      
      throw new Error(err?.message || 'Failed to update transaction');
    }
  }, [enabled, userId, rows]);

  // Optimistic remove with rollback on error
  const remove = useCallback(async (id: string) => {
    if (!enabled || !userId) {
      throw new Error('Not enabled or no user ID');
    }

    // Store original for rollback
    const originalTransaction = rows.find(t => t.id === id);
    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }

    // Apply optimistic update immediately
    setRows(prev => prev.filter(t => t.id !== id));

    try {
      console.log('useTransactions: Deleting transaction:', id);
      
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('useTransactions: Delete error:', deleteError);
        throw deleteError;
      }

      console.log('useTransactions: Transaction deleted successfully:', id);
      
    } catch (err: any) {
      console.error('useTransactions: Error deleting transaction:', err);
      
      // Rollback optimistic update
      setRows(prev => {
        // Find correct position to insert back (maintain date order)
        const index = prev.findIndex(t => new Date(t.date) < new Date(originalTransaction.date));
        if (index === -1) {
          return [...prev, originalTransaction];
        }
        return [...prev.slice(0, index), originalTransaction, ...prev.slice(index)];
      });
      
      throw new Error(err?.message || 'Failed to delete transaction');
    }
  }, [enabled, userId, rows]);

  // Setup realtime subscription with stable channel pattern
  useEffect(() => {
    // Cleanup previous subscription if exists
    if (channelRef.current) {
      console.log('useTransactions: Cleaning up previous subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Only subscribe if enabled and userId is available
    if (!enabled || !filter) {
      console.log('useTransactions: Skipping subscription - not enabled or no userId');
      return;
    }

    console.log('useTransactions: Setting up stable realtime subscription for user:', userId);

    // Create stable channel with fixed bindings
    const bindings: RTBinding[] = [
      { event: '*', schema: 'public', table: 'transactions', filter },
    ];

    const channel = createStableChannel('public:transactions', bindings, (payload) => {
      logSubscription(`Realtime event: ${payload.eventType}`, (payload.new as any)?.id || (payload.old as any)?.id);
      
      try {
        const transformedPayload = {
          eventType: payload.eventType,
          new: payload.new ? transformTransaction(payload.new as Tables<'transactions'>) : undefined,
          old: payload.old && 'id' in payload.old ? { id: payload.old.id } : undefined,
        };

        // Only apply realtime changes if not from optimistic update
        // Skip if we already have this item from optimistic update
        if (payload.eventType === 'INSERT' && payload.new) {
          const existingItem = rows.find(item => item.id === payload.new.id);
          if (existingItem) {
            console.log('🔄 Skipping realtime INSERT - transaction already exists from optimistic update');
            return;
          }
        }

        setRows(prev => applyChange(prev, transformedPayload));
        
      } catch (err) {
        console.error('useTransactions: Error processing realtime event:', err);
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      logSubscription(`Channel status: ${status}`);
      if (status === 'SUBSCRIBED') {
        logSubscription('✅ Successfully subscribed to realtime changes');
        // Fetch once after subscription is established
        fetchOnce();
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ useTransactions: Failed to subscribe to realtime changes');
        logSubscription('❌ Failed to subscribe to realtime changes');
      } else if (status === 'TIMED_OUT') {
        console.error('❌ useTransactions: Subscription timed out');
        logSubscription('❌ Subscription timed out');
      } else if (status === 'CLOSED') {
        logSubscription('🔌 Realtime subscription closed');
      }
    });

    // Store channel reference
    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('useTransactions: Cleaning up realtime subscription');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [enabled, filter, transformTransaction, fetchOnce]);

  return {
    rows,
    loading,
    error,
    refetch,
    add,
    update,
    remove,
  };
}