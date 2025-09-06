import React from 'react';
import { View, Image } from 'react-native';
import { FileX, AlertCircle } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/button';
import { useThemeColor } from '../../../hooks/useThemeColor';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ size: number; color: string }>;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: any; // For custom illustrations
}

export function EmptyState({
  title,
  description,
  icon: Icon = FileX,
  actionLabel,
  onAction,
  illustration,
}: EmptyStateProps) {
  const iconColor = useThemeColor({}, 'muted-foreground');

  return (
    <View className="flex-1 justify-center items-center px-8 py-12">
      <View className="items-center">
        {illustration ? (
          <Image
            source={illustration}
            className="w-32 h-32 mb-6"
            resizeMode="contain"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-6">
            <Icon size={32} color={iconColor} />
          </View>
        )}
        
        <Text className="text-xl font-semibold text-center mb-2">
          {title}
        </Text>
        
        {description && (
          <Text className="text-base text-muted-foreground text-center mb-8 leading-relaxed">
            {description}
          </Text>
        )}
        
        {actionLabel && onAction && (
          <Button onPress={onAction} className="px-8">
            <Text className="text-primary-foreground font-medium">
              {actionLabel}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  actionLabel = 'Try Again',
  onAction,
}: ErrorStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={AlertCircle}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}