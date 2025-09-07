/**
 * Utility for applying realtime database changes to local state
 * Pure and immutable function that handles INSERT, UPDATE, DELETE events
 */

type RowWithId = { id: string | number };

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
}

// Development logging counter
let realtimeEventCounter = 0;

function logRealtimeEvent(eventType: string, itemId?: string | number) {
  if (__DEV__) {
    realtimeEventCounter++;
    console.log(`[Realtime #${realtimeEventCounter}] ${eventType} ${itemId || 'unknown'}`);
  }
}

/**
 * Apply a realtime change to a list of items immutably
 * @param list Current list of items
 * @param payload Realtime event payload from Supabase
 * @returns New list with changes applied
 */
export function applyChange<T extends RowWithId>(
  list: T[], 
  payload: RealtimePayload
): T[] {
  const { eventType, new: nextRow, old: prevRow } = payload;
  
  switch (eventType) {
    case 'INSERT':
      if (!nextRow?.id) {
        console.warn('INSERT event missing new row data');
        return list;
      }
      logRealtimeEvent('INSERT', nextRow.id);
      // Prevent duplicates - check if item already exists
      if (list.find(item => item.id === nextRow.id)) {
        console.warn(`INSERT: Item ${nextRow.id} already exists, skipping`);
        return list;
      }
      // Add new item to the beginning of the list
      return [nextRow as T, ...list];
      
    case 'UPDATE':
      if (!nextRow?.id) {
        console.warn('UPDATE event missing new row data');
        return list;
      }
      logRealtimeEvent('UPDATE', nextRow.id);
      // Replace existing item with updated data
      return list.map(item => 
        item.id === nextRow.id ? (nextRow as T) : item
      );
      
    case 'DELETE':
      if (!prevRow?.id) {
        console.warn('DELETE event missing old row data');
        return list;
      }
      logRealtimeEvent('DELETE', prevRow.id);
      // Remove item from list
      return list.filter(item => item.id !== prevRow.id);
      
    default:
      console.warn(`Unknown event type: ${eventType}`);
      return list;
  }
}

/**
 * Apply multiple realtime changes to a list of items immutably
 * Useful for batch processing realtime events
 */
export function applyChanges<T extends RowWithId>(
  list: T[], 
  payloads: RealtimePayload[]
): T[] {
  return payloads.reduce((currentList, payload) => 
    applyChange(currentList, payload), list
  );
}

/**
 * Check if an item already exists in the list (useful for preventing duplicates)
 */
export function itemExists<T extends RowWithId>(
  list: T[], 
  id: string | number
): boolean {
  return list.some(item => item.id === id);
}

/**
 * Get item by ID from list
 */
export function getItemById<T extends RowWithId>(
  list: T[], 
  id: string | number
): T | undefined {
  return list.find(item => item.id === id);
}

/**
 * Get realtime event statistics (development only)
 */
export function getRealtimeStats() {
  if (__DEV__) {
    return {
      totalEvents: realtimeEventCounter,
      averagePerMinute: realtimeEventCounter / (Date.now() / 60000) || 0
    };
  }
  return null;
}