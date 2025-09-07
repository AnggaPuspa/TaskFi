import React, { useState } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { useThemeColor } from '~/hooks/useThemeColor';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime';
  maximumDate?: Date;
  minimumDate?: Date;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  mode = 'date',
  maximumDate,
  minimumDate,
  disabled = false,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const backgroundColor = useThemeColor({}, 'background');

  const formatDate = (date: Date) => {
    if (mode === 'time') {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (mode === 'datetime') {
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const openPicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
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
        <Calendar size={20} color={mutedColor} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          locale="id-ID"
          is24Hour={true}
        />
      )}
    </View>
  );
}
