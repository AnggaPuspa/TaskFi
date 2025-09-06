import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { Text } from '../../../components/ui/text';

interface AmountInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
  error?: string;
}

export const AmountInput = forwardRef<TextInput, AmountInputProps>(
  ({ value, onChangeText, currency = '$', error, ...props }, ref) => {
    const borderColor = useThemeColor({}, error ? 'destructive' : 'border');
    const textColor = useThemeColor({}, 'foreground');
    const backgroundColor = useThemeColor({}, 'background');
    const placeholderColor = useThemeColor({}, 'muted-foreground');

    const handleTextChange = (text: string) => {
      // Remove any non-numeric characters except decimal point
      const numericText = text.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = numericText.split('.');
      if (parts.length > 2) {
        const formattedText = parts[0] + '.' + parts.slice(1).join('');
        onChangeText(formattedText);
        return;
      }
      
      // Limit decimal places to 2
      if (parts[1] && parts[1].length > 2) {
        const formattedText = parts[0] + '.' + parts[1].substring(0, 2);
        onChangeText(formattedText);
        return;
      }
      
      onChangeText(numericText);
    };

    return (
      <View>
        <View className="flex-row items-center">
          <Text className="text-lg font-medium mr-2" style={{ color: textColor }}>
            {currency}
          </Text>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={handleTextChange}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={placeholderColor}
            className="flex-1 h-11 px-3 py-2 text-lg rounded-lg border"
            style={{
              borderColor,
              backgroundColor,
              color: textColor,
            }}
            accessibilityLabel="Amount input"
            accessibilityHint="Enter the transaction amount"
            {...props}
          />
        </View>
        {error && (
          <Text className="text-xs text-destructive mt-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);