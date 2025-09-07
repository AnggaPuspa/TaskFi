import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, Modal } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useThemeColor } from '~/hooks/useThemeColor';
import { DateTimePickerNative } from './DateTimePickerNative';

interface CustomDateTimePickerProps {
  value: Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime';
  maximumDate?: Date;
  minimumDate?: Date;
  disabled?: boolean;
}

export function CustomDateTimePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  mode = 'date',
  maximumDate,
  minimumDate,
  disabled = false,
}: CustomDateTimePickerProps) {
  // Use our native implementation for all platforms
  return (
    <DateTimePickerNative
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      mode={mode}
      maximumDate={maximumDate}
      minimumDate={minimumDate}
      disabled={disabled}
    />
  );
}
