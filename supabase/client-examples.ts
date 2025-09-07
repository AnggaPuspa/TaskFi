// ================================================================
// SUPABASE CLIENT USAGE EXAMPLES
// ================================================================
// Comprehensive examples for authentication and CRUD operations
// ================================================================

import { supabase, type Tables } from '../utils/supabase';
import type { User, AuthError, PostgrestError } from '@supabase/supabase-js';

// Type aliases for convenience
type Profile = Tables<'profiles'>;
type Transaction = Tables<'transactions'>;
type Todo = Tables<'todos'>;
type Category = Tables<'categories'>;

// ================================================================
// AUTHENTICATION EXAMPLES
// ================================================================

/**
 * User Registration
 */
export const signUp = async (email: string, password: string, username?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    
    console.log('User registered successfully:', data.user?.email);
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, error: error as AuthError };
  }
};

/**
 * User Login
 */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    console.log('User signed in successfully:', data.user?.email);
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error: error as AuthError };
  }
};

/**
 * User Logout
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    console.log('User signed out successfully');
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error as AuthError };
  }
};

/**
 * Get Current User
 */
export const getCurrentUser = async (): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    return { user, error: null };
  } catch (error) {
    console.error('Get user error:', error);
    return { user: null, error: error as AuthError };
  }
};

/**
 * Listen to Auth State Changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  return subscription;
};

// ================================================================
// PROFILE OPERATIONS
// ================================================================

/**
 * Get User Profile
 */
export const getProfile = async (userId: string): Promise<{ profile: Profile | null; error: PostgrestError | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    return { profile: data, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return { profile: null, error: error as PostgrestError };
  }
};

/**
 * Update User Profile
 */
export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Profile updated successfully');
    return { profile: data, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { profile: null, error: error as PostgrestError };
  }
};

// ================================================================
// TRANSACTION OPERATIONS
// ================================================================

/**
 * Get All Transactions for User
 */
export const getTransactions = async (userId: string, filters?: {
  type?: 'income' | 'expense';
  category?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return { transactions: data, error: null };
  } catch (error) {
    console.error('Get transactions error:', error);
    return { transactions: null, error: error as PostgrestError };
  }
};

/**
 * Create New Transaction
 */
export const createTransaction = async (transaction: {
  user_id: string;
  type: 'income' | 'expense';
  category: string;
  title: string;
  note?: string;
  amount: number;
  date: string;
  wallet?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Transaction created successfully');
    return { transaction: data, error: null };
  } catch (error) {
    console.error('Create transaction error:', error);
    return { transaction: null, error: error as PostgrestError };
  }
};

/**
 * Update Transaction
 */
export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Transaction updated successfully');
    return { transaction: data, error: null };
  } catch (error) {
    console.error('Update transaction error:', error);
    return { transaction: null, error: error as PostgrestError };
  }
};

/**
 * Delete Transaction
 */
export const deleteTransaction = async (transactionId: string) => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
    
    console.log('Transaction deleted successfully');
    return { error: null };
  } catch (error) {
    console.error('Delete transaction error:', error);
    return { error: error as PostgrestError };
  }
};

/**
 * Get Transaction Summary by Category
 */
export const getTransactionSummary = async (userId: string, month?: string) => {
  try {
    let query = supabase
      .from('transactions')
      .select('type, category, amount')
      .eq('user_id', userId);

    if (month) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Process summary data
    const summary = data.reduce((acc, transaction) => {
      const key = `${transaction.type}_${transaction.category}`;
      if (!acc[key]) {
        acc[key] = {
          type: transaction.type,
          category: transaction.category,
          amount: 0,
          count: 0,
        };
      }
      acc[key].amount += transaction.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);
    
    return { summary: Object.values(summary), error: null };
  } catch (error) {
    console.error('Get transaction summary error:', error);
    return { summary: null, error: error as PostgrestError };
  }
};

// ================================================================
// TODO OPERATIONS
// ================================================================

/**
 * Get All Todos for User
 */
export const getTodos = async (userId: string, filters?: {
  done?: boolean;
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  dueBefore?: string;
}) => {
  try {
    let query = supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.done !== undefined) {
      query = query.eq('done', filters.done);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.tag) {
      query = query.contains('tags', [filters.tag]);
    }
    if (filters?.dueBefore) {
      query = query.lte('due', filters.dueBefore);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return { todos: data, error: null };
  } catch (error) {
    console.error('Get todos error:', error);
    return { todos: null, error: error as PostgrestError };
  }
};

/**
 * Create New Todo
 */
export const createTodo = async (todo: {
  user_id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due?: string;
  tags?: string[];
}) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .insert(todo)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Todo created successfully');
    return { todo: data, error: null };
  } catch (error) {
    console.error('Create todo error:', error);
    return { todo: null, error: error as PostgrestError };
  }
};

/**
 * Update Todo
 */
export const updateTodo = async (todoId: string, updates: Partial<Todo>) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', todoId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Todo updated successfully');
    return { todo: data, error: null };
  } catch (error) {
    console.error('Update todo error:', error);
    return { todo: null, error: error as PostgrestError };
  }
};

/**
 * Toggle Todo Status
 */
export const toggleTodo = async (todoId: string, done: boolean) => {
  return updateTodo(todoId, { done });
};

/**
 * Delete Todo
 */
export const deleteTodo = async (todoId: string) => {
  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId);

    if (error) throw error;
    
    console.log('Todo deleted successfully');
    return { error: null };
  } catch (error) {
    console.error('Delete todo error:', error);
    return { error: error as PostgrestError };
  }
};

// ================================================================
// CATEGORY OPERATIONS
// ================================================================

/**
 * Get All Categories for User
 */
export const getCategories = async (userId: string, type?: 'income' | 'expense') => {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return { categories: data, error: null };
  } catch (error) {
    console.error('Get categories error:', error);
    return { categories: null, error: error as PostgrestError };
  }
};

/**
 * Create New Category
 */
export const createCategory = async (category: {
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  budget?: number;
}) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Category created successfully');
    return { category: data, error: null };
  } catch (error) {
    console.error('Create category error:', error);
    return { category: null, error: error as PostgrestError };
  }
};

/**
 * Update Category
 */
export const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    
    console.log('Category updated successfully');
    return { category: data, error: null };
  } catch (error) {
    console.error('Update category error:', error);
    return { category: null, error: error as PostgrestError };
  }
};

/**
 * Delete Category
 */
export const deleteCategory = async (categoryId: string) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
    
    console.log('Category deleted successfully');
    return { error: null };
  } catch (error) {
    console.error('Delete category error:', error);
    return { error: error as PostgrestError };
  }
};

// ================================================================
// REAL-TIME SUBSCRIPTIONS
// ================================================================

/**
 * Subscribe to Transaction Changes
 */
export const subscribeToTransactions = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

/**
 * Subscribe to Todo Changes
 */
export const subscribeToTodos = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('todos')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

// ================================================================
// USAGE EXAMPLES IN COMPONENTS
// ================================================================

/*
// Example: Using in a React component

import React, { useEffect, useState } from 'react';
import { getCurrentUser, getTransactions, createTransaction } from './supabase-examples';

export function ExampleComponent() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Get current user
    getCurrentUser().then(({ user }) => {
      if (user) {
        setUser(user);
        
        // Get user's transactions
        getTransactions(user.id).then(({ transactions }) => {
          if (transactions) {
            setTransactions(transactions);
          }
        });
      }
    });
  }, []);

  const handleAddTransaction = async () => {
    if (!user) return;

    const newTransaction = {
      user_id: user.id,
      type: 'expense' as const,
      category: 'Food & Dining',
      title: 'Coffee Shop',
      amount: 5.50,
      date: new Date().toISOString(),
    };

    const { transaction, error } = await createTransaction(newTransaction);
    if (transaction) {
      setTransactions(prev => [transaction, ...prev]);
    }
  };

  return (
    <div>
      <h1>Finance App</h1>
      {user && (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleAddTransaction}>Add Transaction</button>
          
          <h2>Transactions</h2>
          {transactions.map(transaction => (
            <div key={transaction.id}>
              {transaction.title}: ${transaction.amount}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
*/