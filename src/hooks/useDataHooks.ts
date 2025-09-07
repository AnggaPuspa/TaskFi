import { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '../context';
import { TransactionFilters, TodoFilters, Transaction, Todo } from '../types';
import { useStableTransactionFilters, useStableTodoFilters, useDebounceValue } from './useStableFilters';
import { Tables } from '../../utils/supabase';

/**
 * Optimized hook for managing transactions with optimistic updates
 * Provides immediate UI feedback and real-time sync
 */
export function useTransactions(
  filters: TransactionFilters = {}, 
  searchQuery = '',
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const { state, loadTransactions, addTransaction, updateTransaction, deleteTransaction } = useData();
  const debouncedSearchQuery = useDebounceValue(searchQuery.trim(), 300);
  const stableFilters = useStableTransactionFilters(filters, debouncedSearchQuery);
  
  // Local optimistic state for immediate UI updates
  const [optimisticUpdates, setOptimisticUpdates] = useState<{
    adding: Transaction[];
    updating: { [id: string]: Partial<Transaction> };
    deleting: string[];
  }>({ adding: [], updating: {}, deleting: [] });

  // Load transactions when filters change (only if enabled)
  useEffect(() => {
    if (enabled) {
      loadTransactions(stableFilters);
    }
  }, [loadTransactions, stableFilters, enabled]);

  // Combine real data with optimistic updates
  const transactions = useMemo(() => {
    let result = [...state.transactions];
    
    // Remove transactions that are being deleted
    result = result.filter(t => !optimisticUpdates.deleting.includes(t.id));
    
    // Apply optimistic updates
    result = result.map(t => {
      const update = optimisticUpdates.updating[t.id];
      return update ? { ...t, ...update } : t;
    });
    
    // Add optimistically added transactions
    result = [...optimisticUpdates.adding, ...result];
    
    return result;
  }, [state.transactions, optimisticUpdates]);

  // Optimistic add transaction
  const addTransactionOptimistic = useCallback(async (
    transactionData: Omit<Tables<'transactions'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    // Create optimistic transaction
    const optimisticTransaction: Transaction = {
      id: `temp_${Date.now()}`, // Temporary ID
      ...transactionData,
      // Convert null to undefined for type compatibility
      note: transactionData.note ?? undefined,
      wallet: transactionData.wallet ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to optimistic state immediately
    setOptimisticUpdates(prev => ({
      ...prev,
      adding: [optimisticTransaction, ...prev.adding],
    }));

    try {
      // Perform actual database operation
      await addTransaction(transactionData);
      
      // Remove from optimistic state (real-time will handle the real data)
      setOptimisticUpdates(prev => ({
        ...prev,
        adding: prev.adding.filter(t => t.id !== optimisticTransaction.id),
      }));
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => ({
        ...prev,
        adding: prev.adding.filter(t => t.id !== optimisticTransaction.id),
      }));
      throw error;
    }
  }, [addTransaction]);

  // Optimistic update transaction
  const updateTransactionOptimistic = useCallback(async (
    id: string, 
    transactionData: Partial<Tables<'transactions'>>
  ) => {
    // Apply optimistic update immediately
    const transformedData: Partial<Transaction> = {};
    
    // Only include defined properties with proper type conversion
    Object.keys(transactionData).forEach(key => {
      const value = transactionData[key as keyof typeof transactionData];
      if (value !== undefined) {
        if (key === 'note' || key === 'wallet') {
          (transformedData as any)[key] = value ?? undefined;
        } else {
          (transformedData as any)[key] = value;
        }
      }
    });
    
    setOptimisticUpdates(prev => ({
      ...prev,
      updating: {
        ...prev.updating,
        [id]: { 
          ...prev.updating[id], 
          ...transformedData, 
          updatedAt: new Date().toISOString() 
        },
      },
    }));

    try {
      // Perform actual database operation
      await updateTransaction(id, transactionData);
      
      // Remove from optimistic state (real-time will handle the real data)
      setOptimisticUpdates(prev => {
        const { [id]: removed, ...rest } = prev.updating;
        return { ...prev, updating: rest };
      });
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => {
        const { [id]: removed, ...rest } = prev.updating;
        return { ...prev, updating: rest };
      });
      throw error;
    }
  }, [updateTransaction]);

  // Optimistic delete transaction
  const deleteTransactionOptimistic = useCallback(async (id: string) => {
    // Add to deleting list immediately
    setOptimisticUpdates(prev => ({
      ...prev,
      deleting: [...prev.deleting, id],
    }));

    try {
      // Perform actual database operation
      await deleteTransaction(id);
      
      // Remove from optimistic state (real-time will handle the real data)
      setOptimisticUpdates(prev => ({
        ...prev,
        deleting: prev.deleting.filter(deletingId => deletingId !== id),
      }));
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => ({
        ...prev,
        deleting: prev.deleting.filter(deletingId => deletingId !== id),
      }));
      throw error;
    }
  }, [deleteTransaction]);

  // Refetch function for pull-to-refresh
  const refetch = useCallback(async () => {
    if (enabled) {
      await loadTransactions(stableFilters);
    }
  }, [loadTransactions, stableFilters, enabled]);

  return {
    transactions,
    loading: state.loading.transactions,
    error: state.error.transactions,
    reload: refetch,
    refetch,
    // Optimistic operations
    addTransaction: addTransactionOptimistic,
    updateTransaction: updateTransactionOptimistic,
    deleteTransaction: deleteTransactionOptimistic,
  };
}

/**
 * Optimized hook for managing todos with optimistic updates
 */
export function useTodos(options: { filters?: TodoFilters; enabled?: boolean } = {}) {
  const { filters = {}, enabled = true } = options;
  const { state, loadTodos, addTodo, updateTodo, deleteTodo, toggleTodo } = useData();
  const stableFilters = useStableTodoFilters(filters);
  
  // Local optimistic state for immediate UI updates
  const [optimisticUpdates, setOptimisticUpdates] = useState<{
    adding: Todo[];
    updating: { [id: string]: Partial<Todo> };
    deleting: string[];
  }>({ adding: [], updating: {}, deleting: [] });

  // Load todos when filters change (only if enabled)
  useEffect(() => {
    if (enabled) {
      loadTodos(stableFilters);
    }
  }, [loadTodos, stableFilters, enabled]);

  // Combine real data with optimistic updates
  const todos = useMemo(() => {
    let result = [...state.todos];
    
    // Remove todos that are being deleted
    result = result.filter(t => !optimisticUpdates.deleting.includes(t.id));
    
    // Apply optimistic updates
    result = result.map(t => {
      const update = optimisticUpdates.updating[t.id];
      return update ? { ...t, ...update } : t;
    });
    
    // Add optimistically added todos
    result = [...optimisticUpdates.adding, ...result];
    
    return result;
  }, [state.todos, optimisticUpdates]);

  // Optimistic add todo
  const addTodoOptimistic = useCallback(async (
    todoData: Omit<Tables<'todos'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    // Create optimistic todo
    const optimisticTodo: Todo = {
      id: `temp_${Date.now()}`, // Temporary ID
      ...todoData,
      // Convert null to undefined for type compatibility
      description: todoData.description ?? undefined,
      due: todoData.due ?? undefined,
      tags: todoData.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to optimistic state immediately
    setOptimisticUpdates(prev => ({
      ...prev,
      adding: [optimisticTodo, ...prev.adding],
    }));

    try {
      // Perform actual database operation
      await addTodo(todoData);
      
      // Remove from optimistic state (real-time will handle the real data)
      setOptimisticUpdates(prev => ({
        ...prev,
        adding: prev.adding.filter(t => t.id !== optimisticTodo.id),
      }));
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => ({
        ...prev,
        adding: prev.adding.filter(t => t.id !== optimisticTodo.id),
      }));
      throw error;
    }
  }, [addTodo]);

  // Optimistic update todo
  const updateTodoOptimistic = useCallback(async (
    id: string, 
    todoData: Partial<Tables<'todos'>>
  ) => {
    // Apply optimistic update immediately
    const transformedData: Partial<Todo> = {};
    
    // Only include defined properties with proper type conversion
    Object.keys(todoData).forEach(key => {
      const value = todoData[key as keyof typeof todoData];
      if (value !== undefined) {
        if (key === 'description' || key === 'due') {
          (transformedData as any)[key] = value ?? undefined;
        } else if (key === 'tags') {
          (transformedData as any)[key] = value ?? [];
        } else {
          (transformedData as any)[key] = value;
        }
      }
    });
    
    setOptimisticUpdates(prev => ({
      ...prev,
      updating: {
        ...prev.updating,
        [id]: { 
          ...prev.updating[id], 
          ...transformedData, 
          updatedAt: new Date().toISOString() 
        },
      },
    }));

    try {
      // Perform actual database operation
      await updateTodo(id, todoData);
      
      // Remove from optimistic state (real-time will handle the real data)
      setOptimisticUpdates(prev => {
        const { [id]: removed, ...rest } = prev.updating;
        return { ...prev, updating: rest };
      });
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => {
        const { [id]: removed, ...rest } = prev.updating;
        return { ...prev, updating: rest };
      });
      throw error;
    }
  }, [updateTodo]);

  // Optimistic delete todo
  const deleteTodoOptimistic = useCallback(async (id: string) => {
    // Add to deleting list immediately
    setOptimisticUpdates(prev => ({
      ...prev,
      deleting: [...prev.deleting, id],
    }));

    try {
      // Perform actual database operation
      await deleteTodo(id);
      
      // Remove from optimistic state (real-time will handle the real data)
      setOptimisticUpdates(prev => ({
        ...prev,
        deleting: prev.deleting.filter(deletingId => deletingId !== id),
      }));
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => ({
        ...prev,
        deleting: prev.deleting.filter(deletingId => deletingId !== id),
      }));
      throw error;
    }
  }, [deleteTodo]);

  // Optimistic toggle todo
  const toggleTodoOptimistic = useCallback(async (id: string) => {
    const currentTodo = todos.find(t => t.id === id);
    if (!currentTodo) return;

    const newDoneState = !currentTodo.done;
    
    // Apply optimistic update immediately
    setOptimisticUpdates(prev => ({
      ...prev,
      updating: {
        ...prev.updating,
        [id]: { ...prev.updating[id], done: newDoneState, updatedAt: new Date().toISOString() },
      },
    }));

    try {
      // Perform actual database operation
      await toggleTodo(id);
      
      // Remove from optimistic state (real-time will handle the real data)
      setOptimisticUpdates(prev => {
        const { [id]: removed, ...rest } = prev.updating;
        return { ...prev, updating: rest };
      });
    } catch (error) {
      // Rollback optimistic update on error
      setOptimisticUpdates(prev => {
        const { [id]: removed, ...rest } = prev.updating;
        return { ...prev, updating: rest };
      });
      throw error;
    }
  }, [toggleTodo, todos]);

  // Refetch function for pull-to-refresh
  const refetch = useCallback(async () => {
    if (enabled) {
      await loadTodos(stableFilters);
    }
  }, [loadTodos, stableFilters, enabled]);

  return {
    todos,
    loading: state.loading.todos,
    error: state.error.todos,
    reload: refetch,
    refetch,
    // Optimistic operations
    addTodo: addTodoOptimistic,
    updateTodo: updateTodoOptimistic,
    deleteTodo: deleteTodoOptimistic,
    toggleTodo: toggleTodoOptimistic,
  };
}

/**
 * Hook for dashboard data with optimized filtering
 */
export function useDashboardData(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { state } = useData();
  
  const dashboardStats = useMemo(() => {
    // Only compute if enabled and we have data
    if (!enabled) {
      return {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalBalance: 0,
        todaysTodos: [],
        completedTodos: 0,
        pendingTodos: 0,
        recentTransactions: [],
      };
    }
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const monthlyTransactions = state.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = monthlyIncome - monthlyExpenses;
    
    const todaysTodos = state.todos.filter(t => {
      if (!t.due || t.done) return false;
      const dueDate = new Date(t.due);
      return dueDate >= today && dueDate < tomorrow;
    });
    
    const completedTodos = state.todos.filter(t => t.done).length;
    const pendingTodos = state.todos.filter(t => !t.done).length;

    // Recent transactions for chart
    const recentTransactions = state.transactions.slice(0, 7);

    return {
      monthlyIncome,
      monthlyExpenses,
      totalBalance,
      todaysTodos,
      completedTodos,
      pendingTodos,
      recentTransactions,
    };
  }, [state.transactions, state.todos, enabled]);

  // Refetch function for pull-to-refresh
  const refetch = useCallback(async () => {
    // This will trigger a re-computation of dashboardStats
    // The actual data refetch is handled by the DataContext
    return Promise.resolve();
  }, []);

  return {
    ...dashboardStats,
    loading: enabled ? (state.loading.transactions || state.loading.todos) : false,
    error: enabled ? (state.error.transactions || state.error.todos) : undefined,
    refetch,
  };
}