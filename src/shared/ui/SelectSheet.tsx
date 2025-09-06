import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { useThemeColor } from '../../../hooks/useThemeColor';

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  color?: string;
}

interface SelectSheetProps {
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  title?: string;
  searchable?: boolean;
}

export function SelectSheet({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  title = 'Select Option',
  searchable = false,
}: SelectSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'foreground');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const primaryColor = useThemeColor({}, 'primary');

  const selectedOption = options.find(option => option.value === selectedValue);
  
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="h-11 px-3 py-2 rounded-lg border flex-row items-center justify-between"
        style={{ borderColor, backgroundColor }}
        accessibilityRole="button"
        accessibilityLabel={`Select ${title.toLowerCase()}`}
      >
        <View className="flex-row items-center flex-1">
          {selectedOption?.icon && (
            <View className="mr-2">
              <selectedOption.icon 
                size={18} 
                color={selectedOption.color || textColor} 
              />
            </View>
          )}
          <Text 
            className="flex-1" 
            style={{ 
              color: selectedOption ? textColor : mutedColor 
            }}
            numberOfLines={1}
          >
            {selectedOption?.label || placeholder}
          </Text>
        </View>
        <ChevronDown size={16} color={mutedColor} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1" style={{ backgroundColor }}>
          <View className="px-4 py-6 border-b" style={{ borderBottomColor: borderColor }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-semibold">{title}</Text>
              <Button
                variant="ghost"
                onPress={() => setIsOpen(false)}
                className="px-3"
              >
                <Text>Done</Text>
              </Button>
            </View>
          </View>

          <ScrollView className="flex-1">
            {filteredOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                className="px-4 py-4 border-b border-border/50"
                accessibilityRole="button"
                accessibilityLabel={`Select ${option.label}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    {option.icon && (
                      <View className="mr-3">
                        <option.icon 
                          size={20} 
                          color={option.color || textColor} 
                        />
                      </View>
                    )}
                    <Text className="text-base flex-1" numberOfLines={1}>
                      {option.label}
                    </Text>
                  </View>
                  {selectedValue === option.value && (
                    <Check size={20} color={primaryColor} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}