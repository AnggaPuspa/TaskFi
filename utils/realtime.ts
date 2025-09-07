import { supabase } from '~/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RTBinding = {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: 'public';
  table: string;
  filter?: string; // e.g. 'user_id=eq.<uuid>'
};

// Channel cache to prevent duplicate subscriptions
const channelCache = new Map<string, RealtimeChannel>();

/**
 * Create a stable realtime channel with proper cleanup
 * Ensures only one channel per name exists and handles cleanup properly
 */
export function createStableChannel(
  name: string,
  bindings: RTBinding[],
  onChange: (payload: any) => void
): RealtimeChannel {
  // Clean up existing channel if it exists
  if (channelCache.has(name)) {
    const existingChannel = channelCache.get(name)!;
    existingChannel.unsubscribe();
    channelCache.delete(name);
  }

  // Create new channel
  const channel = supabase.channel(name);
  
  // Add all bindings
  bindings.forEach((binding) => {
    channel.on('postgres_changes', binding as any, onChange);
  });

  // Store in cache
  channelCache.set(name, channel);
  
  return channel;
}

/**
 * Clean up all realtime channels
 */
export function cleanupAllChannels(): void {
  channelCache.forEach((channel) => {
    channel.unsubscribe();
  });
  channelCache.clear();
}

/**
 * Clean up a specific channel
 */
export function cleanupChannel(name: string): void {
  if (channelCache.has(name)) {
    const channel = channelCache.get(name)!;
    channel.unsubscribe();
    channelCache.delete(name);
  }
}