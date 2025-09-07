import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode, useEffect, useState, useRef } from 'react';
import { supabase, Tables } from '../../utils/supabase';
import { useAuth } from '~/features/auth/AuthProvider';
import { Transaction, Todo, LoadingState, ErrorState, TransactionFilters, TodoFilters } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

// Action Types
type DataAction =
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'SET_ERROR'; payload: Partial<ErrorState> }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_TODOS'; payload: Todo[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<Todo> } }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'CLEAR_DATA' };

// State Interface
interface DataState {
  transactions: Transaction[];
  todos: Todo[];
  loading: LoadingState;
  error: ErrorState;
}

// Initial State
const initialState: DataState = {
  transactions: [],
  todos: [],
  loading: {
    transactions: false,
    todos: false,
    categories: false,
  },
  error: {},
};

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, ...action.payload },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: { ...state.error, ...action.payload },
      };

    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };

    case 'SET_TODOS':
      return {
        ...state,
        todos: action.payload,
      };

    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };

    case 'ADD_TODO':
      return {
        ...state,
        todos: [action.payload, ...state.todos],
      };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(t => t.id !== action.payload),
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload ? { ...t, done: !t.done } : t
        ),
      };

    case 'CLEAR_DATA':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

// Context Interface
interface DataContextType {
  state: DataState;
  // Data management
  loadTransactions: (filters?: TransactionFilters) => Promise<void>;
  loadTodos: (filters?: TodoFilters) => Promise<void>;
  addTransaction: (input: Omit<Tables<'transactions'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Tables<'transactions'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTodo: (input: Omit<Tables<'todos'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTodo: (id: string, patch: Partial<Tables<'todos'>>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  clearData: () => void;
  refreshData: () => Promise<void>;
  // Connection testing
  testConnection: () => Promise<{ success: boolean; error?: string; data?: any }>;
}

// Create Context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider Component
interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const { session } = useAuth();
  
  // Realtime subscription refs
  const transactionChannelRef = useRef<RealtimeChannel | null>(null);
  const todoChannelRef = useRef<RealtimeChannel | null>(null);
  
  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (transactionChannelRef.current) {
        transactionChannelRef.current.unsubscribe();
      }
      if (todoChannelRef.current) {
        todoChannelRef.current.unsubscribe();
      }
    };
  }, []);

  // Setup transaction realtime subscription
  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Clean up existing subscription
    if (transactionChannelRef.current) {
      transactionChannelRef.current.unsubscribe();
    }
    
    console.log('Setting up transaction realtime subscription for user:', session.user.id);
    
    // Create new subscription
    const channel = supabase
      .channel(`public:transactions:user_id=eq.${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Transaction realtime event:', payload.eventType, (payload.new as any)?.id || (payload.old as any)?.id);
          
          try {
            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new) {
                  const transaction: Transaction = {
                    id: payload.new.id,
                    type: payload.new.type,
                    category: payload.new.category,
                    title: payload.new.title,
                    note: payload.new.note || undefined,
                    amount: payload.new.amount,
                    date: payload.new.date,
                    wallet: payload.new.wallet || undefined,
                    createdAt: payload.new.created_at,
                    updatedAt: payload.new.updated_at,
                  };
                  dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
                }
                break;
              
              case 'UPDATE':
                if (payload.new) {
                  const updates: Partial<Transaction> = {
                    type: payload.new.type,
                    category: payload.new.category,
                    title: payload.new.title,
                    note: payload.new.note || undefined,
                    amount: payload.new.amount,
                    date: payload.new.date,
                    wallet: payload.new.wallet || undefined,
                    updatedAt: payload.new.updated_at,
                  };
                  dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: payload.new.id, updates } });
                }
                break;
              
              case 'DELETE':
                if (payload.old?.id) {
                  dispatch({ type: 'DELETE_TRANSACTION', payload: payload.old.id });
                }
                break;
            }
          } catch (err) {
            console.error('Error processing transaction realtime event:', err);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Transaction channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to transaction changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to transaction changes:', err);
        } else if (status === 'CLOSED') {
          console.log('🔌 Transaction subscription closed');
        }
      });

    transactionChannelRef.current = channel;
    
    // Cleanup function
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [session?.user?.id]);

  // Setup todo realtime subscription
  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Clean up existing subscription
    if (todoChannelRef.current) {
      todoChannelRef.current.unsubscribe();
    }
    
    console.log('Setting up todo realtime subscription for user:', session.user.id);
    
    // Create new subscription
    const channel = supabase
      .channel(`public:todos:user_id=eq.${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Todo realtime event:', payload.eventType, (payload.new as any)?.id || (payload.old as any)?.id);
          
          try {
            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new) {
                  const todo: Todo = {
                    id: payload.new.id,
                    title: payload.new.title,
                    description: payload.new.description || undefined,
                    priority: payload.new.priority,
                    due: payload.new.due || undefined,
                    tags: payload.new.tags || [],
                    done: payload.new.done,
                    createdAt: payload.new.created_at,
                    updatedAt: payload.new.updated_at,
                  };
                  dispatch({ type: 'ADD_TODO', payload: todo });
                }
                break;
              
              case 'UPDATE':
                if (payload.new) {
                  const updates: Partial<Todo> = {
                    title: payload.new.title,
                    description: payload.new.description || undefined,
                    priority: payload.new.priority,
                    due: payload.new.due || undefined,
                    tags: payload.new.tags || [],
                    done: payload.new.done,
                    updatedAt: payload.new.updated_at,
                  };
                  dispatch({ type: 'UPDATE_TODO', payload: { id: payload.new.id, updates } });
                }
                break;
              
              case 'DELETE':
                if (payload.old?.id) {
                  dispatch({ type: 'DELETE_TODO', payload: payload.old.id });
                }
                break;
            }
          } catch (err) {
            console.error('Error processing todo realtime event:', err);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Todo channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to todo changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to todo changes:', err);
        } else if (status === 'CLOSED') {
          console.log('🔌 Todo subscription closed');
        }
      });

    todoChannelRef.current = channel;
    
    // Cleanup function
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [session?.user?.id]);

  const loadTransactions = useCallback(async (filters: TransactionFilters = {}) => {
    if (!session?.user?.id) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: { transactions: true } });
      dispatch({ type: 'SET_ERROR', payload: { transactions: undefined } });
      
      console.log('Loading transactions with filters:', filters);
      
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });
      
      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.wallet) {
        query = query.eq('wallet', filters.wallet);
      }
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,note.ilike.%${filters.searchQuery}%`);
      }
      
      const { data: rows, error } = await query;
      
      if (error) throw error;
      
      const transactions: Transaction[] = rows?.map(row => ({
        id: row.id,
        type: row.type,
        category: row.category,
        title: row.title,
        note: row.note || undefined,
        amount: row.amount,
        date: row.date,
        wallet: row.wallet || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) || [];
      
      console.log(`Loaded ${transactions.length} transactions`);
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      dispatch({ type: 'SET_ERROR', payload: { transactions: err.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { transactions: false } });
    }
  }, [session?.user?.id]);

  const loadTodos = useCallback(async (filters: TodoFilters = {}) => {
    if (!session?.user?.id) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: { todos: true } });
      dispatch({ type: 'SET_ERROR', payload: { todos: undefined } });
      
      console.log('Loading todos with filters:', filters);
      
      let query = supabase
        .from('todos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.completed !== undefined) {
        query = query.eq('done', filters.completed);
      }
      if (filters.tags && filters.tags.length > 0) {
        // For tags, we might want to implement a different approach
        // This is a simplified version
      }
      if (filters.dueDateFilter) {
        // Handle due date filter based on the filter type
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (filters.dueDateFilter) {
          case 'today':
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            query = query.gte('due', today.toISOString().split('T')[0]);
            query = query.lt('due', tomorrow.toISOString().split('T')[0]);
            break;
          case 'week':
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
            query = query.gte('due', today.toISOString().split('T')[0]);
            query = query.lte('due', endOfWeek.toISOString().split('T')[0]);
            break;
        }
      }
      
      const { data: rows, error } = await query;
      
      if (error) throw error;
      
      const todos: Todo[] = rows?.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        priority: row.priority,
        due: row.due || undefined,
        tags: row.tags || [],
        done: row.done,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) || [];
      
      console.log(`Loaded ${todos.length} todos`);
      dispatch({ type: 'SET_TODOS', payload: todos });
      
    } catch (err: any) {
      console.error('Error loading todos:', err);
      dispatch({ type: 'SET_ERROR', payload: { todos: err.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { todos: false } });
    }
  }, [session?.user?.id]);

  const addTransaction = useCallback(async (
    input: Omit<Tables<'transactions'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!session?.user?.id) throw new Error('No user session');
    
    try {
      console.log('Adding transaction:', input);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...input,
          user_id: session.user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Transaction added successfully:', data.id);
      
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      throw new Error(err.message || 'Failed to add transaction');
    }
  }, [session?.user?.id]);

  const updateTransaction = useCallback(async (
    id: string, 
    patch: Partial<Tables<'transactions'>>
  ) => {
    if (!session?.user?.id) throw new Error('No user session');
    
    try {
      console.log('Updating transaction:', id, patch);
      
      const { error } = await supabase
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      console.log('Transaction updated successfully:', id);
      
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      throw new Error(err.message || 'Failed to update transaction');
    }
  }, [session?.user?.id]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!session?.user?.id) throw new Error('No user session');
    
    try {
      console.log('Deleting transaction:', id);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      console.log('Transaction deleted successfully:', id);
      
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      throw new Error(err.message || 'Failed to delete transaction');
    }
  }, [session?.user?.id]);

  const addTodo = useCallback(async (
    input: Omit<Tables<'todos'>, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!session?.user?.id) throw new Error('No user session');
    
    try {
      console.log('Adding todo:', input);
      
      const { data, error } = await supabase
        .from('todos')
        .insert({
          ...input,
          user_id: session.user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Todo added successfully:', data.id);
      
    } catch (err: any) {
      console.error('Error adding todo:', err);
      throw new Error(err.message || 'Failed to add todo');
    }
  }, [session?.user?.id]);

  const updateTodo = useCallback(async (
    id: string, 
    patch: Partial<Tables<'todos'>>
  ) => {
    if (!session?.user?.id) throw new Error('No user session');
    
    try {
      console.log('Updating todo:', id, patch);
      
      const { error } = await supabase
        .from('todos')
        .update(patch)
        .eq('id', id)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      console.log('Todo updated successfully:', id);
      
    } catch (err: any) {
      console.error('Error updating todo:', err);
      throw new Error(err.message || 'Failed to update todo');
    }
  }, [session?.user?.id]);

  const deleteTodo = useCallback(async (id: string) => {
    if (!session?.user?.id) throw new Error('No user session');
    
    try {
      console.log('Deleting todo:', id);
      
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      console.log('Todo deleted successfully:', id);
      
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      throw new Error(err.message || 'Failed to delete todo');
    }
  }, [session?.user?.id]);

  const toggleTodo = useCallback(async (id: string) => {
    if (!session?.user?.id) throw new Error('No user session');
    
    try {
      console.log('Toggling todo:', id);
      
      // First get the current state
      const { data: todo, error: fetchError } = await supabase
        .from('todos')
        .select('done')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();
      
      if (fetchError) throw fetchError;
      if (!todo) throw new Error('Todo not found');
      
      // Toggle the done state
      const { error } = await supabase
        .from('todos')
        .update({ done: !todo.done })
        .eq('id', id)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      console.log('Todo toggled successfully:', id);
      
    } catch (err: any) {
      console.error('Error toggling todo:', err);
      throw new Error(err.message || 'Failed to toggle todo');
    }
  }, [session?.user?.id]);

  const clearData = useCallback(() => {
    dispatch({ type: 'CLEAR_DATA' });
  }, []);

  const refreshData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    // Load all data
    await Promise.all([
      loadTransactions(),
      loadTodos(),
    ]);
  }, [session?.user?.id, loadTransactions, loadTodos]);

  // Test connection function for debugging
  const testConnection = useCallback(async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Supabase connection test successful');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase connection test error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  const contextValue: DataContextType = useMemo(() => ({
    state,
    loadTransactions,
    loadTodos,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    clearData,
    refreshData,
    testConnection,
  }), [
    state,
    loadTransactions,
    loadTodos,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    clearData,
    refreshData,
    testConnection,
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook to use the context
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
