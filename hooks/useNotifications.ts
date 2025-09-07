import { useState, useEffect } from 'react';
import { supabase } from '~/utils/supabase';
import { useAuth } from '~/features/auth/AuthProvider';
import { NotificationService, ReminderData } from '~/services/NotificationService';

export interface UseNotificationsReturn {
  reminders: ReminderData[];
  loading: boolean;
  permissionStatus: string;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  createReminder: (reminder: Omit<ReminderData, 'id' | 'user_id'>) => Promise<boolean>;
  updateReminder: (id: string, updates: Partial<ReminderData>) => Promise<boolean>;
  deleteReminder: (id: string) => Promise<boolean>;
  toggleReminder: (id: string, enabled: boolean) => Promise<boolean>;
  setupDailyExpenseReminder: () => Promise<boolean>;
  refreshReminders: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { session } = useAuth();
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');

  // Load reminders and permission status
  useEffect(() => {
    if (session?.user?.id) {
      loadReminders();
      checkPermissionStatus();
    }
  }, [session?.user?.id]);

  const checkPermissionStatus = async () => {
    try {
      const status = await NotificationService.getPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permission status:', error);
    }
  };

  const loadReminders = async () => {
    try {
      if (!session?.user?.id) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await NotificationService.requestPermissions();
      await checkPermissionStatus();
      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const createReminder = async (reminderData: Omit<ReminderData, 'id' | 'user_id'>): Promise<boolean> => {
    try {
      if (!session?.user?.id) return false;

      const newReminder: ReminderData = {
        ...reminderData,
        user_id: session.user.id,
      };

      // Schedule notification
      const notificationId = await NotificationService.scheduleReminder(newReminder);
      if (!notificationId) {
        return false;
      }

      // Save to database
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          ...newReminder,
          notification_id: notificationId,
        })
        .select()
        .single();

      if (error) {
        // Cancel notification if database save fails
        await NotificationService.cancelReminder(notificationId);
        throw error;
      }

      // Update local state
      setReminders(prev => [data, ...prev]);
      return true;
    } catch (error) {
      console.error('Error creating reminder:', error);
      return false;
    }
  };

  const updateReminder = async (id: string, updates: Partial<ReminderData>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setReminders(prev => prev.map(reminder => 
        reminder.id === id ? { ...reminder, ...data } : reminder
      ));

      return true;
    } catch (error) {
      console.error('Error updating reminder:', error);
      return false;
    }
  };

  const deleteReminder = async (id: string): Promise<boolean> => {
    try {
      // Find reminder to get notification_id
      const reminder = reminders.find(r => r.id === id);
      if (reminder?.notification_id) {
        await NotificationService.cancelReminder(reminder.notification_id);
      }

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  };

  const toggleReminder = async (id: string, enabled: boolean): Promise<boolean> => {
    try {
      const success = await NotificationService.toggleReminder(id, enabled);
      if (success) {
        await loadReminders(); // Refresh to get updated notification_id
      }
      return success;
    } catch (error) {
      console.error('Error toggling reminder:', error);
      return false;
    }
  };

  const setupDailyExpenseReminder = async (): Promise<boolean> => {
    try {
      if (!session?.user?.id) return false;

      const success = await NotificationService.scheduleDailyExpenseReminder(session.user.id);
      if (success) {
        await loadReminders();
      }
      return success;
    } catch (error) {
      console.error('Error setting up daily expense reminder:', error);
      return false;
    }
  };

  const refreshReminders = async () => {
    await loadReminders();
  };

  return {
    reminders,
    loading,
    permissionStatus,
    hasPermission: permissionStatus === 'granted',
    requestPermission,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    setupDailyExpenseReminder,
    refreshReminders,
  };
}
