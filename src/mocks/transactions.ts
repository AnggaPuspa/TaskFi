import { Transaction } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const today = new Date();
const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

export const mockTransactions: Transaction[] = [
  // Recent transactions (this month)
  {
    id: generateId(),
    type: 'income',
    category: 'salary',
    title: 'Monthly Salary',
    amount: 4500,
    date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'food',
    title: 'Grocery Shopping',
    note: 'Weekly groceries from supermarket',
    amount: 85.50,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'transportation',
    title: 'Gas Station',
    amount: 45.00,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'food',
    title: 'Coffee Shop',
    amount: 12.75,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'income',
    category: 'freelance',
    title: 'Web Development Project',
    note: 'Client payment for website redesign',
    amount: 850,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'bills',
    title: 'Internet Bill',
    amount: 79.99,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'shopping',
    title: 'Online Purchase',
    note: 'New headphones from Amazon',
    amount: 125.00,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'entertainment',
    title: 'Movie Theater',
    amount: 28.50,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'health',
    title: 'Gym Membership',
    amount: 49.99,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'food',
    title: 'Restaurant Dinner',
    note: 'Date night at Italian restaurant',
    amount: 67.80,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 9).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Last month transactions
  {
    id: generateId(),
    type: 'income',
    category: 'salary',
    title: 'Monthly Salary',
    amount: 4500,
    date: lastMonth.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'bills',
    title: 'Rent Payment',
    amount: 1200,
    date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'bills',
    title: 'Electricity Bill',
    amount: 89.45,
    date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 3).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'expense',
    category: 'transportation',
    title: 'Public Transport',
    amount: 45.00,
    date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    type: 'income',
    category: 'investment',
    title: 'Stock Dividends',
    amount: 150.00,
    date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const getTransactionById = (id: string): Transaction | undefined => {
  return mockTransactions.find(transaction => transaction.id === id);
};

export const getTransactionsByDateRange = (startDate: string, endDate: string): Transaction[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return mockTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= start && transactionDate <= end;
  });
};

export const getTransactionsByCategory = (categoryId: string): Transaction[] => {
  return mockTransactions.filter(transaction => transaction.category === categoryId);
};

export const getTransactionsByType = (type: 'income' | 'expense'): Transaction[] => {
  return mockTransactions.filter(transaction => transaction.type === type);
};