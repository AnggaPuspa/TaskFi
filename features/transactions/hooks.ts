import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { supabase, Tables } from '~/utils/supabase';
import { useAuth } from '~/features/auth/AuthProvider';
import { queryKeys } from '~/utils/queryClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Modern transactions hooks with React Query + Supabase Realtime
 * Industry standard features:
 * - React Query for caching, background sync, offline support
 * - Optimistic updates for instant UI feedback
 * - Realtime subscriptions for live data sync
 * - Proper error handling and loading states
 * - Type-safe throughout
 */

// Types
interface Transaction {
  id: string;
  amount: number;
  title: string;
  note?: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  wallet?: string;
  createdAt: string;
  updatedAt: string;
}

type CreateTransactionInput = Omit<Tables<'transactions'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
type UpdateTransactionInput = Partial<Omit<Tables<'transactions'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Transform Supabase row to our Transaction type
const transformTransaction = (row: Tables<'transactions'>): Transaction => ({
  id: row.id,
  amount: row.amount,
  title: row.title,
  note: row.note || undefined,
  category: row.category,
  type: row.type,
  date: row.date,
  wallet: row.wallet || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Hook options
interface UseTransactionsOptions {
  enabled?: boolean;
}

// Hook return type
interface UseTransactionsReturn {
  // Data
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: UpdateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Utils
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { enabled = true } = options;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const userId = user?.id;
  const shouldFetch = enabled && isAuthenticated && !!userId;

  // Fetch transactions with React Query
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.transactionsList(userId!),
    queryFn: async (): Promise<Transaction[]> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTransactions] Fetching transactions for user:', userId);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('[useTransactions] Fetch error:', error);
        throw new Error(error.message);
      }

      const transformedData = data?.map(transformTransaction) || [];
      console.log(`[useTransactions] Loaded ${transformedData.length} transactions`);

      return transformedData;
    },
    enabled: shouldFetch,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Add transaction mutation with optimistic update
  const addTransactionMutation = useMutation({
    mutationFn: async (input: CreateTransactionInput): Promise<Tables<'transactions'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTransactions] Adding transaction:', input);

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...input,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('[useTransactions] Add error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async (newTransaction) => {
      if (!userId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsList(userId) });

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactionsList(userId));

      // Optimistically update cache
      const optimisticTransaction: Transaction = {
        id: `temp_${Date.now()}_${Math.random()}`,
        ...newTransaction,
        note: newTransaction.note || undefined,
        wallet: newTransaction.wallet || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactionsList(userId),
        (old = []) => [optimisticTransaction, ...old]
      );

      return { previousTransactions, optimisticTransaction };
    },
    onError: (err, newTransaction, context) => {
      // Rollback on error
      if (context?.previousTransactions && userId) {
        queryClient.setQueryData(queryKeys.transactionsList(userId), context.previousTransactions);
      }
      console.error('[useTransactions] Add transaction failed:', err);
    },
    onSettled: () => {
      // Always refetch after error or success
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.transactionsList(userId) });
      }
    },
  });

  // Update transaction mutation with optimistic update
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTransactionInput }): Promise<Tables<'transactions'>> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTransactions] Updating transaction:', id, input);

      const { data, error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[useTransactions] Update error:', error);
        throw new Error(error.message);
      }

      return data;
    },
    onMutate: async ({ id, input }) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsList(userId) });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactionsList(userId));

      // Optimistically update cache
      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactionsList(userId),
        (old = []) => old.map(transaction =>
          transaction.id === id
            ? {
                ...transaction,
                ...input,
                note: input.note !== undefined ? (input.note || undefined) : transaction.note,
                wallet: input.wallet !== undefined ? (input.wallet || undefined) : transaction.wallet,
                updatedAt: new Date().toISOString(),
              }
            : transaction
        )
      );

      return { previousTransactions };
    },
    onError: (err, variables, context) => {
      if (context?.previousTransactions && userId) {
        queryClient.setQueryData(queryKeys.transactionsList(userId), context.previousTransactions);
      }
      console.error('[useTransactions] Update transaction failed:', err);
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.transactionsList(userId) });
      }
    },
  });

  // Delete transaction mutation with optimistic update
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!userId) throw new Error('User not authenticated');

      console.log('[useTransactions] Deleting transaction:', id);

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('[useTransactions] Delete error:', error);
        throw new Error(error.message);
      }
    },
    onMutate: async (id) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsList(userId) });

      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactionsList(userId));

      // Optimistically remove from cache
      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactionsList(userId),
        (old = []) => old.filter(transaction => transaction.id !== id)
      );

      return { previousTransactions };
    },
    onError: (err, id, context) => {
      if (context?.previousTransactions && userId) {
        queryClient.setQueryData(queryKeys.transactionsList(userId), context.previousTransactions);
      }
      console.error('[useTransactions] Delete transaction failed:', err);
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.transactionsList(userId) });
      }
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!shouldFetch) return;

    // Cleanup previous subscription
    if (channelRef.current) {
      console.log('[useTransactions] Cleaning up previous realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('[useTransactions] Setting up realtime subscription for user:', userId);

    // Create new channel
    const channel = supabase
      .channel(`public:transactions:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useTransactions] Realtime event:', payload.eventType);

          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({
            queryKey: queryKeys.transactionsList(userId!),
            exact: true,
          });
        }
      )
      .subscribe((status) => {
        console.log('[useTransactions] Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useTransactions] ✅ Successfully subscribed to realtime changes');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        console.log('[useTransactions] Cleaning up realtime subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shouldFetch, userId, queryClient]);

  // Action functions
  const addTransaction = useCallback(async (input: CreateTransactionInput): Promise<void> => {
    await addTransactionMutation.mutateAsync(input);
  }, [addTransactionMutation]);

  const updateTransaction = useCallback(async (id: string, input: UpdateTransactionInput): Promise<void> => {
    await updateTransactionMutation.mutateAsync({ id, input });
  }, [updateTransactionMutation]);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    await deleteTransactionMutation.mutateAsync(id);
  }, [deleteTransactionMutation]);

  const refetchTransactions = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  return {
    transactions,
    isLoading,
    error: error as Error | null,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: refetchTransactions,
    isRefetching,
  };
}