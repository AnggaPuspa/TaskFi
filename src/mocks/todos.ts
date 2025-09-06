import { Todo } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

export const mockTodos: Todo[] = [
  {
    id: generateId(),
    title: 'Review monthly budget',
    description: 'Analyze spending patterns and adjust budget categories for next month',
    done: false,
    priority: 'high',
    due: today.toISOString(),
    tags: ['finance', 'monthly'],
    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Pay credit card bill',
    description: 'Due date is approaching, pay the full balance',
    done: false,
    priority: 'high',
    due: tomorrow.toISOString(),
    tags: ['bills', 'urgent'],
    createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Grocery shopping',
    description: 'Buy weekly groceries - milk, bread, fruits, vegetables',
    done: false,
    priority: 'medium',
    due: tomorrow.toISOString(),
    tags: ['shopping', 'food'],
    createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Submit expense reports',
    description: 'Submit work-related expense reports for reimbursement',
    done: false,
    priority: 'medium',
    due: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['work', 'finance'],
    createdAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Call insurance agent',
    description: 'Discuss policy renewal options and potential discounts',
    done: false,
    priority: 'low',
    due: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['insurance', 'phone'],
    createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Research investment options',
    description: 'Look into index funds and ETFs for long-term investment',
    done: false,
    priority: 'medium',
    due: nextWeek.toISOString(),
    tags: ['investment', 'research'],
    createdAt: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Schedule car maintenance',
    description: 'Oil change and general checkup due soon',
    done: false,
    priority: 'low',
    due: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['car', 'maintenance'],
    createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: 'Update emergency fund',
    description: 'Transfer money to emergency savings account',
    done: false,
    priority: 'medium',
    due: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['savings', 'emergency'],
    createdAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Completed todos
  {
    id: generateId(),
    title: 'Set up automatic bill payments',
    description: 'Configure autopay for utilities and subscriptions',
    done: true,
    priority: 'high',
    tags: ['bills', 'automation'],
    createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    title: 'Download tax documents',
    description: 'Get W-2 and 1099 forms from employers',
    done: true,
    priority: 'medium',
    tags: ['taxes', 'documents'],
    createdAt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    title: 'Cancel unused subscriptions',
    description: 'Review and cancel streaming services not being used',
    done: true,
    priority: 'low',
    tags: ['subscriptions', 'savings'],
    createdAt: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // Overdue tasks
  {
    id: generateId(),
    title: 'File tax return',
    description: 'Complete and submit tax return for this year',
    done: false,
    priority: 'high',
    due: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['taxes', 'overdue'],
    createdAt: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const getTodoById = (id: string): Todo | undefined => {
  return mockTodos.find(todo => todo.id === id);
};

export const getTodosByPriority = (priority: 'low' | 'medium' | 'high'): Todo[] => {
  return mockTodos.filter(todo => todo.priority === priority);
};

export const getCompletedTodos = (): Todo[] => {
  return mockTodos.filter(todo => todo.done);
};

export const getPendingTodos = (): Todo[] => {
  return mockTodos.filter(todo => !todo.done);
};

export const getTodaysTodos = (): Todo[] => {
  const todayStr = today.toISOString().split('T')[0];
  return mockTodos.filter(todo => {
    if (!todo.due) return false;
    const dueDate = new Date(todo.due).toISOString().split('T')[0];
    return dueDate === todayStr && !todo.done;
  });
};

export const getOverdueTodos = (): Todo[] => {
  return mockTodos.filter(todo => {
    if (!todo.due || todo.done) return false;
    return new Date(todo.due) < today;
  });
};