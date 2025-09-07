import { supabase, Tables } from '~/utils/supabase';

/**
 * Categories API functions
 * All functions are user-scoped for security
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

/**
 * Fetch all categories for the authenticated user
 */
export async function fetchCategories(userId: string): Promise<Category[]> {
  console.log('[fetchCategories] Fetching categories for user:', userId);

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchCategories] Error:', error);
    throw new Error(error.message);
  }

  const transformedData = data?.map(transformCategory) || [];
  console.log(`[fetchCategories] Loaded ${transformedData.length} categories`);

  return transformedData;
}

/**
 * Fetch a single category by ID
 */
export async function fetchCategoryById(userId: string, categoryId: string): Promise<Category> {
  console.log('[fetchCategoryById] Fetching category:', categoryId, 'for user:', userId);

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[fetchCategoryById] Error:', error);
    throw new Error(error.message);
  }

  return transformCategory(data);
}

/**
 * Create a new category
 */
export async function createCategory(userId: string, input: CreateCategoryInput): Promise<Category> {
  console.log('[createCategory] Creating category for user:', userId, input);

  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...input,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('[createCategory] Error:', error);
    throw new Error(error.message);
  }

  console.log('[createCategory] Created category:', data.id);
  return transformCategory(data);
}

/**
 * Update an existing category
 */
export async function updateCategory(userId: string, categoryId: string, input: UpdateCategoryInput): Promise<Category> {
  console.log('[updateCategory] Updating category:', categoryId, 'for user:', userId, input);

  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateCategory] Error:', error);
    throw new Error(error.message);
  }

  console.log('[updateCategory] Updated category:', data.id);
  return transformCategory(data);
}

/**
 * Delete a category
 */
export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  console.log('[deleteCategory] Deleting category:', categoryId, 'for user:', userId);

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId);

  if (error) {
    console.error('[deleteCategory] Error:', error);
    throw new Error(error.message);
  }

  console.log('[deleteCategory] Deleted category:', categoryId);
}

/**
 * Fetch categories by type (income/expense)
 */
export async function fetchCategoriesByType(userId: string, type: 'income' | 'expense'): Promise<Category[]> {
  console.log('[fetchCategoriesByType] Fetching', type, 'categories for user:', userId);

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('name', { ascending: true });

  if (error) {
    console.error('[fetchCategoriesByType] Error:', error);
    throw new Error(error.message);
  }

  const transformedData = data?.map(transformCategory) || [];
  console.log(`[fetchCategoriesByType] Loaded ${transformedData.length} ${type} categories`);

  return transformedData;
}
