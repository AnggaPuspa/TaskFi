import { Category } from '../types';

export const mockCategories: Category[] = [
  // Income Categories
  {
    id: 'salary',
    name: 'Salary',
    icon: 'Briefcase',
    color: '#10B981',
    type: 'income',
    budget: 5000,
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: 'Code',
    color: '#3B82F6',
    type: 'income',
  },
  {
    id: 'investment',
    name: 'Investment',
    icon: 'TrendingUp',
    color: '#8B5CF6',
    type: 'income',
  },
  {
    id: 'bonus',
    name: 'Bonus',
    icon: 'Gift',
    color: '#F59E0B',
    type: 'income',
  },

  // Expense Categories
  {
    id: 'food',
    name: 'Food & Dining',
    icon: 'UtensilsCrossed',
    color: '#EF4444',
    type: 'expense',
    budget: 500,
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: 'Car',
    color: '#6366F1',
    type: 'expense',
    budget: 300,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#EC4899',
    type: 'expense',
    budget: 400,
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    icon: 'Receipt',
    color: '#84CC16',
    type: 'expense',
    budget: 800,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'Gamepad2',
    color: '#F97316',
    type: 'expense',
    budget: 200,
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    icon: 'Heart',
    color: '#06B6D4',
    type: 'expense',
    budget: 150,
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'GraduationCap',
    color: '#8B5CF6',
    type: 'expense',
    budget: 300,
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: 'Plane',
    color: '#10B981',
    type: 'expense',
    budget: 600,
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'MoreHorizontal',
    color: '#6B7280',
    type: 'expense',
  },
];

export const getCategoryById = (id: string): Category | undefined => {
  return mockCategories.find(category => category.id === id);
};

export const getCategoriesByType = (type: 'income' | 'expense'): Category[] => {
  return mockCategories.filter(category => category.type === type);
};