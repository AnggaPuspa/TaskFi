import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { useThemeColor } from '~/hooks/useThemeColor';
import { DateTimePickerNative } from './DateTimePickerNative';

interface TimePickerFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TimePickerField({
  value,
  onChange,
  placeholder = 'Pilih waktu',
  disabled = false,
}: TimePickerFieldProps) {
  return (
    <DateTimePickerNative
      value={value}
      onChange={(date) => date && onChange(date)}
      placeholder={placeholder}
      mode="time"
      disabled={disabled}
    />
  );
}

export default TimePickerField;
