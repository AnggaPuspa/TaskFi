import { supabase } from '~/utils/supabase';
import type { Tables } from '~/utils/supabase';

// Todo type based on Supabase schema
export type Todo = Tables<'todos'>;

// Fetch all todos for a user
export async function fetchTodos(userId: string) {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Fetch a single todo by ID
export async function fetchTodoById(userId: string, todoId: string) {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('id', todoId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Create a new todo
export async function createTodo(userId: string, input: Omit<Todo, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('todos')
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

// Update a todo
export async function updateTodo(userId: string, todoId: string, updates: Partial<Todo>) {
  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', todoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Delete a todo
export async function deleteTodo(userId: string, todoId: string) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', todoId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

// Toggle a todo's done status
export async function toggleTodo(userId: string, todoId: string) {
  // First get the current state
  const { data: todo, error: fetchError } = await supabase
    .from('todos')
    .select('done')
    .eq('id', todoId)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!todo) {
    throw new Error('Todo not found');
  }

  // Toggle the done state
  const { data, error } = await supabase
    .from('todos')
    .update({ done: !todo.done })
    .eq('id', todoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}