import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Filter, Search, X } from 'lucide-react-native';
import { Text } from '../../../components/ui/text';
import { Input } from '../../../components/ui/input';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { TransactionFilters, TransactionType } from '../../types';
import { mockCategories } from '../../mocks/categories';

interface FilterBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onSearchChange: (query: string) => void;
}

export function FilterBar({ 
  filters, 
  onFiltersChange, 
  onSearchChange 
}: FilterBarProps) {
  const [showSearch, setShowSearch] = useState(false);
  
  const primaryColor = useThemeColor({}, 'primary');
  const mutedColor = useThemeColor({}, 'muted-foreground');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const handleTypeFilter = (type: TransactionType | undefined) => {
    onFiltersChange({ ...filters, type });
  };

  const handleCategoryFilter = (categoryId: string | undefined) => {
    onFiltersChange({ ...filters, category: categoryId });
  };

  const clearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <View className="bg-card border-b border-border">
      {/* Main Filter Row */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          className="mr-3 p-2 rounded-lg"
          style={{ backgroundColor: showSearch ? primaryColor + '20' : 'transparent' }}
          accessibilityRole="button"
          accessibilityLabel="Toggle search"
        >
          <Search size={20} color={showSearch ? primaryColor : mutedColor} />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-row items-center flex-1 justify-center py-2 px-3 rounded-lg border"
          style={{ borderColor }}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Filter size={16} color={mutedColor} />
          <Text className="ml-2 text-sm" style={{ color: mutedColor }}>
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Text>
        </TouchableOpacity>
        
        {activeFiltersCount > 0 && (
          <TouchableOpacity
            onPress={clearFilters}
            className="ml-3 p-2 rounded-lg"
            style={{ backgroundColor: mutedColor + '20' }}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <X size={16} color={mutedColor} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Search Bar */}
      {showSearch && (
        <View className="px-4 pb-3">
          <Input
            placeholder="Search transactions..."
            value={filters.searchQuery || ''}
            onChangeText={onSearchChange}
            className="h-10"
          />
        </View>
      )}
      
      {/* Filter Pills */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {/* Type Filter Pills */}
        <View className="flex-row mr-4">
          <TouchableOpacity
            onPress={() => handleTypeFilter(undefined)}
            className="mr-2 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: !filters.type ? primaryColor : 'transparent',
              borderColor: !filters.type ? primaryColor : borderColor,
            }}
          >
            <Text 
              className="text-sm"
              style={{ 
                color: !filters.type ? 'white' : mutedColor 
              }}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleTypeFilter('income')}
            className="mr-2 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: filters.type === 'income' ? primaryColor : 'transparent',
              borderColor: filters.type === 'income' ? primaryColor : borderColor,
            }}
          >
            <Text 
              className="text-sm"
              style={{ 
                color: filters.type === 'income' ? 'white' : mutedColor 
              }}
            >
              Income
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleTypeFilter('expense')}
            className="mr-2 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: filters.type === 'expense' ? primaryColor : 'transparent',
              borderColor: filters.type === 'expense' ? primaryColor : borderColor,
            }}
          >
            <Text 
              className="text-sm"
              style={{ 
                color: filters.type === 'expense' ? 'white' : mutedColor 
              }}
            >
              Expense
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Category Filter Pills */}
        <View className="w-px h-6 bg-border mx-3" />
        
        <TouchableOpacity
          onPress={() => handleCategoryFilter(undefined)}
          className="mr-2 px-3 py-1 rounded-full border"
          style={{
            backgroundColor: !filters.category ? primaryColor : 'transparent',
            borderColor: !filters.category ? primaryColor : borderColor,
          }}
        >
          <Text 
            className="text-sm"
            style={{ 
              color: !filters.category ? 'white' : mutedColor 
            }}
          >
            All Categories
          </Text>
        </TouchableOpacity>
        
        {mockCategories
          .filter(cat => !filters.type || cat.type === filters.type)
          .map(category => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryFilter(category.id)}
              className="mr-2 px-3 py-1 rounded-full border"
              style={{
                backgroundColor: filters.category === category.id ? category.color : 'transparent',
                borderColor: filters.category === category.id ? category.color : borderColor,
              }}
            >
              <Text 
                className="text-sm"
                style={{ 
                  color: filters.category === category.id ? 'white' : mutedColor 
                }}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))
        }
      </ScrollView>
    </View>
  );
}