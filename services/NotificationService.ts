import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { supabase } from '~/utils/supabase';
import i18n from '~/i18n';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ReminderData {
  id?: string;
  user_id: string;
  type: 'daily_expense' | 'todo_due';
  title: string;
  body: string;
  time: string; // HH:MM:SS format
  timezone: string;
  enabled: boolean;
  notification_id?: string;
}

export class NotificationService {
  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          i18n.t('permissionRequired'),
          i18n.t('notificationPermissionDenied')
        );
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Get current notification permissions status
   */
  static async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status as string;
  }

  /**
   * Schedule a daily reminder
   */
  static async scheduleReminder(reminder: ReminderData): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Parse time (format: HH:MM:SS)
      const [hours, minutes] = reminder.time.split(':').map(Number);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: {
            type: reminder.type,
            reminderId: reminder.id,
          },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling reminder:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all reminders:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Schedule daily expense reminder (9 PM local time)
   */
  static async scheduleDailyExpenseReminder(userId: string): Promise<boolean> {
    try {
      const reminderData: ReminderData = {
        user_id: userId,
        type: 'daily_expense',
        title: i18n.t('dailyExpenseReminderTitle'),
        body: i18n.t('dailyExpenseReminderBody'),
        time: '21:00:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: true,
      };

      const notificationId = await this.scheduleReminder(reminderData);
      if (!notificationId) {
        return false;
      }

      // Save to database
      const { error } = await supabase
        .from('reminders')
        .upsert({
          ...reminderData,
          notification_id: notificationId,
        });

      if (error) {
        console.error('Error saving reminder to database:', error);
        // Cancel the notification if database save fails
        await this.cancelReminder(notificationId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error scheduling daily expense reminder:', error);
      return false;
    }
  }

  /**
   * Schedule todo due date reminder (9 AM one day before due date)
   */
  static async scheduleTodoReminder(todoId: string, todoTitle: string, dueDate: Date): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Calculate reminder time (9 AM one day before due date)
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(9, 0, 0, 0);

      // Only schedule if reminder date is in the future
      if (reminderDate <= new Date()) {
        return false;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('todoReminderTitle'),
          body: i18n.t('todoReminderBody', { title: todoTitle }),
          data: {
            type: 'todo_due',
            todoId,
          },
        },
        trigger: {
          date: reminderDate,
        } as any,
      });

      return !!notificationId;
    } catch (error) {
      console.error('Error scheduling todo reminder:', error);
      return false;
    }
  }

  /**
   * Load and reschedule all user reminders
   */
  static async loadUserReminders(userId: string): Promise<void> {
    try {
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) {
        console.error('Error loading user reminders:', error);
        return;
      }

      if (!reminders || reminders.length === 0) {
        return;
      }

      // Reschedule all active reminders
      for (const reminder of reminders) {
        const notificationId = await this.scheduleReminder(reminder);
        if (notificationId && notificationId !== reminder.notification_id) {
          // Update notification ID in database
          await supabase
            .from('reminders')
            .update({ notification_id: notificationId })
            .eq('id', reminder.id);
        }
      }
    } catch (error) {
      console.error('Error loading user reminders:', error);
    }
  }

  /**
   * Toggle reminder on/off
   */
  static async toggleReminder(reminderId: string, enabled: boolean): Promise<boolean> {
    try {
      const { data: reminder, error: fetchError } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', reminderId)
        .single();

      if (fetchError || !reminder) {
        console.error('Error fetching reminder:', fetchError);
        return false;
      }

      if (enabled) {
        // Schedule the reminder
        const notificationId = await this.scheduleReminder(reminder);
        if (!notificationId) {
          return false;
        }

        // Update database
        const { error } = await supabase
          .from('reminders')
          .update({
            enabled: true,
            notification_id: notificationId,
          })
          .eq('id', reminderId);

        return !error;
      } else {
        // Cancel the reminder
        if (reminder.notification_id) {
          await this.cancelReminder(reminder.notification_id);
        }

        // Update database
        const { error } = await supabase
          .from('reminders')
          .update({
            enabled: false,
            notification_id: null,
          })
          .eq('id', reminderId);

        return !error;
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      return false;
    }
  }
}
