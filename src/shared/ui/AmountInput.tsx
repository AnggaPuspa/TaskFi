import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { Text } from '../../../components/ui/text';
import { formatInputIDR, parseIDR } from '../../../utils/currency';

interface AmountInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  currency?: string;
  error?: string;
}

export const AmountInput = forwardRef<TextInput, AmountInputProps>(
  ({ value, onChangeText, currency = 'Rp', error, ...props }, ref) => {
    const borderColor = useThemeColor({}, error ? 'destructive' : 'border');
    const textColor = useThemeColor({}, 'foreground');
    const backgroundColor = useThemeColor({}, 'background');
    const placeholderColor = useThemeColor({}, 'muted-foreground');

    const handleTextChange = (text: string) => {
      // Remove all non-numeric characters except decimal
      const numericText = text.replace(/[^0-9]/g, '');
      
      if (numericText === '') {
        onChangeText('');
        return;
      }
      
      // Convert to number and format for Indonesian locale
      const number = parseInt(numericText, 10);
      const formattedText = formatInputIDR(number);
      onChangeText(formattedText);
    };

    // Convert display value to actual number for storage
    const getNumericValue = () => {
      if (!value) return 0;
      return parseIDR(value);
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
            placeholder="0"
            placeholderTextColor={placeholderColor}
            className="flex-1 h-11 px-3 py-2 text-lg rounded-lg border"
            style={{
              borderColor,
              backgroundColor,
              color: textColor,
            }}
            accessibilityLabel="Amount input"
            accessibilityHint="Masukkan jumlah transaksi dalam Rupiah"
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