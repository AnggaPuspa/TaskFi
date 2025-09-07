import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, Modal, Alert } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useThemeColor } from '~/hooks/useThemeColor';

interface DateTimePickerNativeProps {
  value: Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime';
  maximumDate?: Date;
  minimumDate?: Date;
  disabled?: boolean;
}

export function DateTimePickerNative({
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  mode = 'date',
  maximumDate,
  minimumDate,
  disabled = false,
}: DateTimePickerNativeProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');

  const formatDate = (date: Date) => {
    if (mode === 'time') {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (mode === 'datetime') {
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const openPicker = () => {
    if (!disabled) {
      setTempDate(value);
      if (Platform.OS === 'web') {
        // For web, we'll show a simple modal with date input
        setShowModal(true);
      } else {
        // For mobile, we can implement a custom picker
        setShowModal(true);
      }
    }
  };

  const closePicker = () => {
    setShowModal(false);
  };

  const confirmDate = () => {
    // Validate date range
    if (minimumDate && tempDate < minimumDate) {
      Alert.alert('Error', 'Tanggal tidak boleh kurang dari tanggal minimum yang diizinkan');
      return;
    }
    if (maximumDate && tempDate > maximumDate) {
      Alert.alert('Error', 'Tanggal tidak boleh lebih dari tanggal maksimum yang diizinkan');
      return;
    }
    
    onChange(tempDate);
    closePicker();
  };

  const getIcon = () => {
    if (mode === 'time') {
      return <Clock size={20} color={mutedColor} />;
    }
    return <Calendar size={20} color={mutedColor} />;
  };

  // Simple date adjustment functions
  const adjustDate = (field: 'day' | 'month' | 'year' | 'hour' | 'minute', increment: number) => {
    const newDate = new Date(tempDate);
    
    switch (field) {
      case 'day':
        newDate.setDate(newDate.getDate() + increment);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + increment);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + increment);
        break;
      case 'hour':
        newDate.setHours(newDate.getHours() + increment);
        break;
      case 'minute':
        newDate.setMinutes(newDate.getMinutes() + increment);
        break;
    }
    
    setTempDate(newDate);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={openPicker}
        disabled={disabled}
        className={`flex-row items-center justify-between p-3 border rounded-lg ${
          disabled ? 'opacity-50' : ''
        }`}
        style={{ borderColor, backgroundColor }}
      >
        <Text className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? formatDate(value) : placeholder}
        </Text>
        {getIcon()}
      </TouchableOpacity>

      {showModal && (
        <Modal
          transparent
          animationType="fade"
          visible={showModal}
          onRequestClose={closePicker}
        >
          <View className="flex-1 justify-center bg-black/50 p-4">
            <View className="bg-card rounded-xl p-6" style={{ backgroundColor: cardColor }}>
              <Text className="text-xl font-semibold mb-4 text-center">
                {mode === 'time' ? 'Pilih Waktu' : mode === 'datetime' ? 'Pilih Tanggal & Waktu' : 'Pilih Tanggal'}
              </Text>

              {/* Date Display */}
              <View className="items-center mb-6">
                <Text className="text-2xl font-bold mb-2">
                  {formatDate(tempDate)}
                </Text>
              </View>

              {/* Date Controls */}
              {(mode === 'date' || mode === 'datetime') && (
                <View className="mb-6">
                  <Text className="text-lg font-medium mb-2">Tanggal</Text>
                  
                  {/* Year */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="flex-1">Tahun</Text>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity
                        onPress={() => adjustDate('year', -1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="w-16 text-center font-medium">
                        {tempDate.getFullYear()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => adjustDate('year', 1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Month */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="flex-1">Bulan</Text>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity
                        onPress={() => adjustDate('month', -1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="w-16 text-center font-medium">
                        {tempDate.getMonth() + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => adjustDate('month', 1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Day */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="flex-1">Hari</Text>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity
                        onPress={() => adjustDate('day', -1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="w-16 text-center font-medium">
                        {tempDate.getDate()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => adjustDate('day', 1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Time Controls */}
              {(mode === 'time' || mode === 'datetime') && (
                <View className="mb-6">
                  <Text className="text-lg font-medium mb-2">Waktu</Text>
                  
                  {/* Hour */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="flex-1">Jam</Text>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity
                        onPress={() => adjustDate('hour', -1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="w-16 text-center font-medium">
                        {tempDate.getHours().toString().padStart(2, '0')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => adjustDate('hour', 1)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Minute */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="flex-1">Menit</Text>
                    <View className="flex-row items-center gap-4">
                      <TouchableOpacity
                        onPress={() => adjustDate('minute', -5)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">-</Text>
                      </TouchableOpacity>
                      <Text className="w-16 text-center font-medium">
                        {tempDate.getMinutes().toString().padStart(2, '0')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => adjustDate('minute', 5)}
                        className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center"
                      >
                        <Text className="text-primary font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <Button
                  variant="outline"
                  onPress={closePicker}
                  className="flex-1"
                >
                  <Text>Batal</Text>
                </Button>
                <Button
                  onPress={confirmDate}
                  className="flex-1"
                >
                  <Text className="text-white">Pilih</Text>
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default DateTimePickerNative;
