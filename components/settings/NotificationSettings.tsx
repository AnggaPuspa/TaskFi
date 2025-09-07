import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { useNotifications } from '~/hooks/useNotifications';
import { useLanguage } from '~/hooks/useLanguage';
import { Bell, Clock, AlertCircle, CheckCircle } from 'lucide-react-native';

export default function NotificationSettings() {
  const { t } = useLanguage();
  const {
    reminders,
    loading,
    hasPermission,
    permissionStatus,
    requestPermission,
    setupDailyExpenseReminder,
    toggleReminder,
    refreshReminders,
  } = useNotifications();

  const [dailyExpenseEnabled, setDailyExpenseEnabled] = useState(false);
  const [todoReminderEnabled, setTodoReminderEnabled] = useState(false);

  // Update local state when reminders change
  useEffect(() => {
    const dailyExpense = reminders.find(r => r.type === 'daily_expense');
    const todoReminder = reminders.find(r => r.type === 'todo_due');
    
    setDailyExpenseEnabled(dailyExpense?.enabled ?? false);
    setTodoReminderEnabled(todoReminder?.enabled ?? false);
  }, [reminders]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert(t('success'), 'Izin notifikasi diberikan!');
      await refreshReminders();
    }
  };

  const handleToggleDailyExpense = async (enabled: boolean) => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }

      if (enabled) {
        // Setup new reminder
        const success = await setupDailyExpenseReminder();
        if (success) {
          setDailyExpenseEnabled(true);
          Alert.alert(t('success'), 'Pengingat pengeluaran harian diaktifkan');
        } else {
          Alert.alert(t('error'), 'Gagal mengatur pengingat pengeluaran harian');
        }
      } else {
        // Find and disable existing reminder
        const dailyExpense = reminders.find(r => r.type === 'daily_expense');
        if (dailyExpense?.id) {
          const success = await toggleReminder(dailyExpense.id, false);
          if (success) {
            setDailyExpenseEnabled(false);
            Alert.alert(t('success'), 'Pengingat pengeluaran harian dinonaktifkan');
          } else {
            Alert.alert(t('error'), 'Gagal menonaktifkan pengingat pengeluaran harian');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling daily expense reminder:', error);
      Alert.alert(t('error'), 'Terjadi kesalahan');
    }
  };

  const getPermissionStatusIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'denied':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <AlertCircle size={20} className="text-yellow-500" />;
    }
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'undetermined':
        return 'Not requested';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted-foreground">{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background p-4" showsVerticalScrollIndicator={false}>
      {/* Permission Status */}
      <View className="bg-card rounded-lg p-4 mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-foreground">
            {t('notificationPermissions')}
          </Text>
          {getPermissionStatusIcon()}
        </View>
        
        <Text className="text-sm text-muted-foreground mb-3">
          Status: {getPermissionStatusText()}
        </Text>

        {!hasPermission && (
          <Button
            onPress={handleRequestPermission}
            variant="outline"
            className="mt-2"
          >
            <Text className="text-primary">Minta Izin</Text>
          </Button>
        )}
      </View>

      {/* Reminder Settings */}
      <View className="bg-card rounded-lg p-4 mb-6">
        <Text className="text-lg font-semibold text-foreground mb-4">
          Pengaturan Pengingat
        </Text>

        {/* Daily Expense Reminder */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center mb-1">
              <Clock size={16} className="text-muted-foreground mr-2" />
              <Text className="text-base font-medium text-foreground">
                {t('dailyExpenseReminder')}
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground">
              Pengingat harian pada pukul 21:00 untuk mencatat pengeluaran
            </Text>
          </View>
          <Switch
            value={dailyExpenseEnabled}
            onValueChange={handleToggleDailyExpense}
            disabled={!hasPermission}
          />
        </View>

        <Separator className="my-2" />

        {/* Todo Reminder */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center mb-1">
              <Bell size={16} className="text-muted-foreground mr-2" />
              <Text className="text-base font-medium text-foreground">
                {t('todoReminder')}
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground">
              Pengingat untuk todo yang jatuh tempo besok (pukul 09:00)
            </Text>
          </View>
          <Switch
            value={todoReminderEnabled}
            onValueChange={(enabled) => {
              // This would be handled automatically when creating/updating todos
              setTodoReminderEnabled(enabled);
            }}
            disabled={!hasPermission}
          />
        </View>
      </View>

      {/* Active Reminders */}
      {reminders.length > 0 && (
        <View className="bg-card rounded-lg p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Pengingat Aktif
          </Text>
          
          {reminders.map((reminder) => (
            <View key={reminder.id} className="py-3 border-b border-border last:border-b-0">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    {reminder.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {reminder.body}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Waktu: {reminder.time} • Tipe: {reminder.type}
                  </Text>
                </View>
                <Switch
                  value={reminder.enabled}
                  onValueChange={async (enabled) => {
                    await toggleReminder(reminder.id!, enabled);
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Help Text */}
      {!hasPermission && (
        <View className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
          <View className="flex-row items-start">
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
            <Text className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
              {t('notificationPermissionDenied')} Aktifkan notifikasi di pengaturan perangkat untuk menerima pengingat.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
