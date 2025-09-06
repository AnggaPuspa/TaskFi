import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { Label } from '../../../components/ui/label';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
}

export function FormField({ 
  label, 
  children, 
  error, 
  required = false, 
  description 
}: FormFieldProps) {
  return (
    <View className="gap-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <Text className="text-destructive ml-1">*</Text>}
      </Label>
      
      {description && (
        <Text className="text-xs text-muted-foreground">
          {description}
        </Text>
      )}
      
      {children}
      
      {error && (
        <Text className="text-xs text-destructive">
          {error}
        </Text>
      )}
    </View>
  );
}