import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Platform } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  format?: (date: Date) => string;
}

export function CustomDateTimePicker({
  value,
  onChange,
  mode = 'date',
  placeholder,
  minimumDate,
  maximumDate,
  format,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted-foreground');

  const formatDate = (date: Date): string => {
    if (format) return format(date);
    
    switch (mode) {
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      default:
        return date.toLocaleDateString();
    }
  };

  const IconComponent = mode === 'time' ? Clock : Calendar;

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="h-11 px-3 py-2 rounded-lg border flex-row items-center justify-between"
        style={{ borderColor, backgroundColor }}
        accessibilityRole="button"
        accessibilityLabel={`Select ${mode}`}
      >
        <View className="flex-row items-center flex-1">
          <IconComponent size={18} color={mutedColor} style={{ marginRight: 8 }} />
          <Text className="flex-1" style={{ color: textColor }} numberOfLines={1}>
            {value ? formatDate(value) : placeholder || `Select ${mode}`}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1" style={{ backgroundColor }}>
          <View className="px-4 py-6 border-b border-border">
            <View className="flex-row items-center justify-between">
              <Button variant="ghost" onPress={() => setIsOpen(false)}>
                <Text>Cancel</Text>
              </Button>
              <Text className="text-lg font-semibold">
                Select {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
              <Button variant="ghost" onPress={() => setIsOpen(false)}>
                <Text className="font-semibold">Done</Text>
              </Button>
            </View>
          </View>
          
          <View className="flex-1 justify-center items-center">
            <Text className="text-muted-foreground">
              Date/Time picker will be implemented with native components
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}