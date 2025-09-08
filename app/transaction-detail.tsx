import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useTransactions } from '~/features/transactions/hooks';
import { formatIDR } from '~/utils/currency';

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { transactions, deleteTransaction } = useTransactions();
  
  const transaction = useMemo(() => 
    transactions.find(t => t.id === id), [transactions, id]
  );

  if (!transaction) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center">
        <View className="items-center px-6">
          <View className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl items-center justify-center mb-4">
            <FileText size={24} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Transaksi Tidak Ditemukan
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
            Transaksi yang Anda cari mungkin telah dihapus atau tidak tersedia
          </Text>
          <Button
            onPress={() => router.back()}
            className="bg-blue-600 px-8 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">Kembali</Text>
          </Button>
        </View>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  
  const handleEdit = () => {
    router.push(`/add-transaction?id=${transaction.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus transaksi');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View 
        className="bg-white dark:bg-gray-800 px-6 pb-4 border-b border-gray-100 dark:border-gray-700"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Detail Transaksi
          </Text>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleEdit}
              className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center"
            >
              <Edit3 size={18} color="#3B82F6" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleDelete}
              className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center"
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Amount Hero Section */}
        <View className="px-6 py-8">
          <LinearGradient
            colors={isIncome ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-8"
          >
            <View className="items-center">
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6">
                {isIncome ? (
                  <TrendingUp size={36} color="white" />
                ) : (
                  <TrendingDown size={36} color="white" />
                )}
              </View>
              
              <Text className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wide">
                {isIncome ? 'Pemasukan' : 'Pengeluaran'}
              </Text>
              
              <Text className="text-white text-4xl font-bold mb-3">
                {isIncome ? '+' : ''}{formatIDR(transaction.amount)}
              </Text>
              
              <Text className="text-white/90 text-xl font-medium text-center">
                {transaction.title}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Transaction Details */}
        <View className="px-6">
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Informasi Transaksi
            </Text>
            
            {/* Category */}
            <View className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-700">
              <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl items-center justify-center mr-4">
                <Tag size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Kategori
                </Text>
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  {transaction.category}
                </Text>
              </View>
            </View>

            {/* Date */}
            <View className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-700">
              <View className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl items-center justify-center mr-4">
                <Calendar size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Tanggal Transaksi
                </Text>
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  {formatDate(transaction.date)}
                </Text>
              </View>
            </View>

            {/* Created Date */}
            <View className="flex-row items-center py-4">
              <View className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl items-center justify-center mr-4">
                <Clock size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Dibuat Pada
                </Text>
                <Text className="text-base font-medium text-gray-900 dark:text-white">
                  {formatCreatedDate(transaction.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        {transaction.note && (
          <View className="px-6 mt-6">
            <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-xl items-center justify-center mr-4">
                  <FileText size={20} color="#6B7280" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Catatan
                </Text>
              </View>
              <Text className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {transaction.note}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-6 mt-8">
          <View className="flex-row gap-4">
            <Button
              onPress={handleEdit}
              className="flex-1 bg-blue-600 h-14 rounded-2xl flex-row items-center justify-center"
            >
              <Edit3 size={20} color="white" />
              <Text className="text-white font-medium ml-2">Edit Transaksi</Text>
            </Button>
            
            <TouchableOpacity
              onPress={handleDelete}
              className="h-14 px-6 bg-red-50 dark:bg-red-900/20 rounded-2xl items-center justify-center border border-red-200 dark:border-red-800"
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
