# Quick Start Guide

This guide provides a quick overview of how to use the new production-quality architecture and add new features to the application.

## Prerequisites

Make sure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
features/
├── auth/              # Authentication system
│   ├── AuthProvider.tsx
│   └── guard.tsx
├── transactions/      # Transaction management
│   ├── api.ts
│   ├── hooks.ts
│   └── screens/
└── todos/             # Todo management
    ├── api.ts
    ├── hooks.ts
    └── screens/

utils/                 # Utility functions
constants/             # Constant values
components/            # Shared components
```

## Adding a New Feature

### 1. Create Feature Directory
```bash
mkdir features/newFeature
```

### 2. Implement API Layer
Create `features/newFeature/api.ts`:
```typescript
import { supabase } from '~/utils/supabase';
import type { Tables } from '~/utils/supabase';

export type NewFeatureItem = Tables<'new_feature_table'>;

export async function fetchItems(userId: string) {
  const { data, error } = await supabase
    .from('new_feature_table')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return data;
}

export async function createItem(userId: string, input: Omit<NewFeatureItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('new_feature_table')
    .insert({
      ...input,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

### 3. Implement Hooks Layer
Create `features/newFeature/hooks.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '~/features/auth/AuthProvider';
import * as Api from './api';
import { queryKeys } from '~/constants/queryKeys';

export function useItems() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.newFeature(userId || ''),
    queryFn: () => Api.fetchItems(userId!),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnReconnect: true,
  });
}

export function useCreateItem() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof Api.createItem>[1]) =>
      Api.createItem(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.newFeature(userId!) });
    },
  });
}
```

### 4. Add Query Keys
Update `constants/queryKeys.ts`:
```typescript
export const queryKeys = {
  transactions: (userId: string) => ['transactions', userId] as const,
  todos: (userId: string) => ['todos', userId] as const,
  newFeature: (userId: string) => ['newFeature', userId] as const,
};
```

### 5. Use in Components
```typescript
import { useItems, useCreateItem } from '~/features/newFeature/hooks';

function MyComponent() {
  const { data: items, isLoading, error } = useItems();
  const { mutate: createItem } = useCreateItem();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View>
      {items?.map(item => (
        <Item key={item.id} item={item} />
      ))}
      <Button 
        title="Add Item" 
        onPress={() => createItem({ title: 'New Item' })} 
      />
    </View>
  );
}
```

## Authentication

### Protecting Routes
Use the `withAuth` HOC:
```typescript
import { withAuth } from '~/features/auth/guard';

function ProtectedComponent() {
  return <View>Protected Content</View>;
}

export default withAuth(ProtectedComponent);
```

### Accessing Auth State
```typescript
import { useAuth } from '~/features/auth/AuthProvider';

function MyComponent() {
  const { user, status, signIn, signOut } = useAuth();
  
  if (status === 'loading') {
    return <LoadingScreen />;
  }
  
  if (status === 'unauthenticated') {
    return <LoginScreen onSignIn={signIn} />;
  }
  
  return <MainApp user={user} onSignOut={signOut} />;
}
```

## Testing

### Run Tests
```bash
npm test              # Run all tests
npm test:watch        # Run tests in watch mode
npm test:coverage     # Run tests with coverage report
```

### Run Linting
```bash
npm lint              # Run ESLint
npm type-check        # Run TypeScript type checking
```

## CI/CD

The project includes GitHub Actions for automated testing:
- Type checking on every pull request
- Linting on every pull request
- Tests on every pull request

## Key Benefits of This Architecture

1. **Performance**: Caching with TanStack Query reduces network requests
2. **Reliability**: Proper error handling and session management
3. **Offline Support**: Cached data serving and mutation queueing
4. **Maintainability**: Clear separation of concerns
5. **Extensibility**: Easy to add new features following established patterns
6. **Quality**: Automated testing and linting ensure code quality

## Common Patterns

### Data Fetching
```typescript
const { data, isLoading, error } = useQueryName();
```

### Mutations
```typescript
const { mutate, isLoading, error } = useMutationName();

mutate(inputData);
```

### Real-time Updates
The hooks automatically handle real-time updates through TanStack Query's invalidation system.

### Error Handling
All hooks return error information that can be used to display user-friendly messages.

This architecture provides a solid foundation for building production-quality React Native applications with Expo.