import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Todo, LoadingState, ErrorState } from '../types';
import { mockTransactions, mockTodos } from '../mocks';

// Action Types
type DataAction =
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'SET_ERROR'; payload: Partial<ErrorState> }
  | { type: 'LOAD_DATA'; payload: { transactions: Transaction[]; todos: Todo[] } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'UPDATE_TODO'; payload: Todo }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: string };

// State Interface
interface DataState {
  transactions: Transaction[];
  todos: Todo[];
  loading: LoadingState;
  error: ErrorState;
}

// Initial State
const initialState: DataState = {
  transactions: [],
  todos: [],
  loading: {
    transactions: false,
    todos: false,
    categories: false,
  },
  error: {},
};

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, ...action.payload },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: { ...state.error, ...action.payload },
      };

    case 'LOAD_DATA':
      return {
        ...state,
        transactions: action.payload.transactions,
        todos: action.payload.todos,
        loading: { transactions: false, todos: false, categories: false },
        error: {},
      };

    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };

    case 'ADD_TODO':
      return {
        ...state,
        todos: [action.payload, ...state.todos],
      };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(t => t.id !== action.payload),
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload
            ? { ...t, done: !t.done, updatedAt: new Date().toISOString() }
            : t
        ),
      };

    default:
      return state;
  }
}

// Context Interface
interface DataContextType {
  state: DataState;
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Todo methods
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodo: (id: string, todo: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  // Data management
  refreshData: () => Promise<void>;
}

// Create Context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEYS = {
  TRANSACTIONS: '@FinanceApp/transactions',
  TODOS: '@FinanceApp/todos',
};

// Provider Component
interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Load data from AsyncStorage
  const loadData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { transactions: true, todos: true } });

      const [transactionsData, todosData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.TODOS),
      ]);

      const transactions = transactionsData 
        ? JSON.parse(transactionsData) 
        : mockTransactions; // Use mock data as fallback

      const todos = todosData 
        ? JSON.parse(todosData) 
        : mockTodos; // Use mock data as fallback

      // Save mock data to storage if no data exists
      if (!transactionsData) {
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(mockTransactions));
      }
      if (!todosData) {
        await AsyncStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(mockTodos));
      }

      dispatch({ type: 'LOAD_DATA', payload: { transactions, todos } });
    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { 
          transactions: 'Failed to load transactions',
          todos: 'Failed to load todos'
        } 
      });
      dispatch({ type: 'SET_LOADING', payload: { transactions: false, todos: false } });
    }
  };

  // Save transactions to storage
  const saveTransactions = async (transactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw new Error('Failed to save transactions');
    }
  };

  // Save todos to storage
  const saveTodos = async (todos: Todo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    } catch (error) {
      console.error('Error saving todos:', error);
      throw new Error('Failed to save todos');
    }
  };

  // Transaction methods
  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const newTransaction: Transaction = {
        ...transactionData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
      
      const updatedTransactions = [newTransaction, ...state.transactions];
      await saveTransactions(updatedTransactions);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw new Error('Failed to add transaction');
    }
  };

  const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
    try {
      const existingTransaction = state.transactions.find(t => t.id === id);
      if (!existingTransaction) throw new Error('Transaction not found');

      const updatedTransaction: Transaction = {
        ...existingTransaction,
        ...transactionData,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
      
      const updatedTransactions = state.transactions.map(t =>
        t.id === id ? updatedTransaction : t
      );
      await saveTransactions(updatedTransactions);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      
      const updatedTransactions = state.transactions.filter(t => t.id !== id);
      await saveTransactions(updatedTransactions);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  };

  // Todo methods
  const addTodo = async (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const newTodo: Todo = {
        ...todoData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      dispatch({ type: 'ADD_TODO', payload: newTodo });
      
      const updatedTodos = [newTodo, ...state.todos];
      await saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error adding todo:', error);
      throw new Error('Failed to add todo');
    }
  };

  const updateTodo = async (id: string, todoData: Partial<Todo>) => {
    try {
      const existingTodo = state.todos.find(t => t.id === id);
      if (!existingTodo) throw new Error('Todo not found');

      const updatedTodo: Todo = {
        ...existingTodo,
        ...todoData,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_TODO', payload: updatedTodo });
      
      const updatedTodos = state.todos.map(t =>
        t.id === id ? updatedTodo : t
      );
      await saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error updating todo:', error);
      throw new Error('Failed to update todo');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      dispatch({ type: 'DELETE_TODO', payload: id });
      
      const updatedTodos = state.todos.filter(t => t.id !== id);
      await saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw new Error('Failed to delete todo');
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      dispatch({ type: 'TOGGLE_TODO', payload: id });
      
      const updatedTodos = state.todos.map(t =>
        t.id === id
          ? { ...t, done: !t.done, updatedAt: new Date().toISOString() }
          : t
      );
      await saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error toggling todo:', error);
      throw new Error('Failed to toggle todo');
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const contextValue: DataContextType = {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refreshData,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook to use the context
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}