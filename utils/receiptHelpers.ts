// ================================================================
// RECEIPT SUPABASE HELPERS
// ================================================================
// Helper functions for saving receipts to Supabase
// ================================================================

import { supabase, type Database } from './supabase';

type ReceiptInsert = Database['public']['Tables']['receipts']['Insert'];
type ReceiptRow = Database['public']['Tables']['receipts']['Row'];

interface SaveReceiptResult {
  success: boolean;
  data?: ReceiptRow;
  error?: string;
}

/**
 * Save receipt data to Supabase
 */
export async function saveReceiptToSupabase(receiptData: ReceiptInsert): Promise<SaveReceiptResult> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .insert(receiptData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Receipt save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get user's receipts with optional filtering
 */
export async function getUserReceipts(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    status?: 'pending' | 'parsed' | 'confirmed' | 'failed';
    startDate?: string;
    endDate?: string;
  } = {}
) {
  try {
    let query = supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.startDate) {
      query = query.gte('purchase_date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('purchase_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Get receipts error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    };
  }
}

/**
 * Update receipt data
 */
export async function updateReceipt(
  receiptId: string,
  updates: Partial<ReceiptInsert>
): Promise<SaveReceiptResult> {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .update(updates)
      .eq('id', receiptId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Update receipt error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Delete receipt
 */
export async function deleteReceipt(receiptId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Delete receipt error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload receipt image to Supabase Storage (optional)
 */
export async function uploadReceiptImage(
  userId: string,
  imageUri: string,
  fileName: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // Read file as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create file path: user_id/timestamp_filename
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}_${fileName}`;

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw error;
    }

    return {
      success: true,
      path: data.path
    };
  } catch (error) {
    console.error('Upload image error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get signed URL for receipt image
 */
export async function getReceiptImageUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get image URL error:', error);
    return null;
  }
}

/**
 * Get receipt statistics for user
 */
export async function getReceiptStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('receipt_summaries')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw error;
    }

    return {
      success: true,
      data: data || {
        total_receipts: 0,
        confirmed_receipts: 0,
        total_spent: 0,
        avg_confidence: 0,
        first_receipt: null,
        last_receipt: null
      }
    };
  } catch (error) {
    console.error('Get stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}
