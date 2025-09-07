// Query keys for TanStack Query
export const queryKeys = {
  transactions: (userId: string) => ['transactions', userId] as const,
  todos: (userId: string) => ['todos', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  categories: (userId: string) => ['categories', userId] as const,
};