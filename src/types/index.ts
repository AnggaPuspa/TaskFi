// Core data types for the Finance Todo App

export type TransactionType = 'income' | 'expense';
export type Priority = 'low' | 'medium' | 'high';
export type TodoFilter = 'all' | 'today' | 'week' | 'completed';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  title: string;
  note?: string;
  amount: number;
  date: string; // ISO string
  wallet?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: Priority;
  due?: string; // ISO string
  tags?: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex color code
  type: TransactionType;
  budget?: number; // Monthly budget limit
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
}

// Filter and sorting types
export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  wallet?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface TodoFilters {
  priority?: Priority;
  completed?: boolean;
  tags?: string[];
  dueDateFilter?: TodoFilter;
}

// UI State types
export interface LoadingState {
  transactions: boolean;
  todos: boolean;
  categories: boolean;
}

export interface ErrorState {
  transactions?: string;
  todos?: string;
  categories?: string;
}

// Form types
export interface TransactionFormData {
  type: TransactionType;
  category: string;
  title: string;
  note?: string;
  amount: string; // String for form input
  date: Date;
  wallet?: string;
}

export interface TodoFormData {
  title: string;
  description?: string;
  priority: Priority;
  due?: Date;
  tags?: string[];
}

// Analytics types
export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  categoryBreakdown: CategorySpending[];
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  todaysTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

// Theme and preferences
export interface AppPreferences {
  currency: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultWallet?: string;
  budgetWarnings: boolean;
}

// Navigation types
export interface TabParamList {
  dashboard: undefined;
  transactions: { filter?: TransactionFilters };
  todos: { filter?: TodoFilters };
  reports: { period?: string };
  settings: undefined;
}

export interface StackParamList {
  'add-transaction': { transaction?: Transaction };
  'add-todo': { todo?: Todo };
  'transaction-details': { transactionId: string };
  'todo-details': { todoId: string };
}