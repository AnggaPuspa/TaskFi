import { supabase } from '~/utils/supabase';
import type { Tables } from '~/utils/supabase';

// Transaction type based on Supabase schema
export type Transaction = Tables<'transactions'>;

// Fetch all transactions for a user
export async function fetchTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Fetch a single transaction by ID
export async function fetchTransactionById(userId: string, transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('id', transactionId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Create a new transaction
export async function createTransaction(userId: string, input: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...input,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Update a transaction
export async function updateTransaction(userId: string, transactionId: string, updates: Partial<Transaction>) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Delete a transaction
export async function deleteTransaction(userId: string, transactionId: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}