import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTodos, useCreateTodo, useToggleTodo } from '../../features/todos/hooks';
import * as TodoApi from '../../features/todos/api';

// Mock the AuthProvider context
jest.mock('../../features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

// Create a custom wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock the Todo API
jest.mock('../../features/todos/api');

describe('Todos Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTodos', () => {
    it('should fetch todos successfully', async () => {
      const mockTodos = [
        {
          id: '1',
          title: 'Test Todo',
          done: false,
          priority: 'medium',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];
      
      (TodoApi.fetchTodos as jest.Mock).mockResolvedValue(mockTodos);

      const { result, waitFor } = renderHook(() => useTodos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(result.current.data).toEqual(mockTodos);
      expect(TodoApi.fetchTodos).toHaveBeenCalledWith('user-123');
    });

    it('should handle fetch errors', async () => {
      (TodoApi.fetchTodos as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result, waitFor } = renderHook(() => useTodos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      
      expect(result.current.error).toEqual(new Error('Network error'));
    });
  });

  describe('useCreateTodo', () => {
    it('should create a todo successfully', async () => {
      const mockTodo = {
        id: '1',
        title: 'New Todo',
        done: false,
        priority: 'high',
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      (TodoApi.createTodo as jest.Mock).mockResolvedValue(mockTodo);

      const { result, waitFor } = renderHook(() => useCreateTodo(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({
          title: 'New Todo',
          description: 'Test description',
          done: false,
          priority: 'high',
          due: null,
          tags: [],
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(result.current.data).toEqual(mockTodo);
      expect(TodoApi.createTodo).toHaveBeenCalledWith(
        'user-123',
        {
          title: 'New Todo',
          description: 'Test description',
          done: false,
          priority: 'high',
          due: null,
          tags: [],
        }
      );
    });
  });

  describe('useToggleTodo', () => {
    it('should toggle a todo successfully', async () => {
      const mockTodo = {
        id: '1',
        title: 'Test Todo',
        done: true,
        priority: 'medium',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      (TodoApi.toggleTodo as jest.Mock).mockResolvedValue(mockTodo);

      const { result, waitFor } = renderHook(() => useToggleTodo(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(result.current.data).toEqual(mockTodo);
      expect(TodoApi.toggleTodo).toHaveBeenCalledWith('user-123', '1');
    });
  });
});