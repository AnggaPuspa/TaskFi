# 🚀 Supabase Backend Setup Guide

## Complete Finance Todo App Backend with Authentication

This guide provides everything you need to set up a complete Supabase backend for your Finance Todo app, including authentication, profiles, transactions, todos, and categories.

---

## 📊 Entity Mapping (Dummy Data → Database Schema)

### Transactions
- **Original fields:** `id`, `type`, `category`, `title`, `note`, `amount`, `date`, `wallet`, `createdAt`, `updatedAt`
- **Added for backend:** `user_id` (for multi-tenancy)
- **Database name:** `transactions`

### Todos  
- **Original fields:** `id`, `title`, `description`, `done`, `priority`, `due`, `tags`, `createdAt`, `updatedAt`
- **Added for backend:** `user_id` (for multi-tenancy)
- **Database name:** `todos`

### Categories
- **Original fields:** `id`, `name`, `icon`, `color`, `type`, `budget`
- **Added for backend:** `user_id` (for user-specific categories)
- **Database name:** `categories`

### Profiles
- **New table:** User profile information linked to Supabase auth
- **Fields:** `id`, `username`, `avatar_url`, `currency`, `created_at`, `updated_at`

---

## 🗃️ Database Schema Overview

### 1. **profiles** Table
```sql
- id: uuid (primary key, references auth.users)
- username: text (unique)
- avatar_url: text
- currency: text (default 'IDR')
- created_at: timestamptz
- updated_at: timestamptz
```

### 2. **transactions** Table  
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- type: text ('income' | 'expense')
- category: text
- title: text (required)
- note: text (optional)
- amount: numeric(12,2) (required)
- date: timestamptz (required)
- wallet: text (optional)
- created_at: timestamptz
- updated_at: timestamptz
```

### 3. **todos** Table
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- title: text (required)
- description: text (optional)
- done: boolean (default false)
- priority: text ('low' | 'medium' | 'high', default 'medium')
- due: timestamptz (optional)
- tags: text[] (array, default empty)
- created_at: timestamptz
- updated_at: timestamptz
```

### 4. **categories** Table
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- name: text (required)
- type: text ('income' | 'expense')
- icon: text (optional)
- color: text (optional)
- budget: numeric(12,2) (optional)
- created_at: timestamptz
- updated_at: timestamptz
```

---

## 🔐 Row Level Security (RLS) Policies

All tables have RLS enabled with policies ensuring users can only access their own data:

### Profiles Policies
- ✅ Users can view their own profile
- ✅ Users can update their own profile  
- ✅ Users can insert their own profile (auto-handled by trigger)

### Transactions Policies
- ✅ Users can CRUD their own transactions (`auth.uid() = user_id`)

### Todos Policies  
- ✅ Users can CRUD their own todos (`auth.uid() = user_id`)

### Categories Policies
- ✅ Users can CRUD their own categories (`auth.uid() = user_id`)

---

## 🛠️ Setup Instructions

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Settings > API** to get your credentials

### Step 2: Run Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **Run** to execute the schema

### Step 3: Enable Authentication
1. Go to **Authentication > Settings**
2. Enable **Email/Password** provider
3. Configure any additional settings as needed

### Step 4: Load Seed Data (Optional)
1. In **SQL Editor**, copy and paste `supabase/seed-data.sql`
2. **Replace** `'00000000-0000-0000-0000-000000000000'` with actual user IDs
3. Run the script to insert sample data

### Step 5: Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Supabase URL and anon key from **Settings > API**
3. Ensure `.env` is in your `.gitignore`

### Step 6: Install Dependencies
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

---

## 📝 Usage Examples

### Authentication
```typescript
import { signUp, signIn, signOut, getCurrentUser } from './supabase/client-examples';

// Register new user
const { user, error } = await signUp('user@example.com', 'password123', 'username');

// Sign in user
const { user, error } = await signIn('user@example.com', 'password123');

// Sign out
await signOut();

// Get current user
const { user } = await getCurrentUser();
```

### Transactions
```typescript
import { getTransactions, createTransaction, updateTransaction } from './supabase/client-examples';

// Get user's transactions
const { transactions } = await getTransactions(userId, {
  type: 'expense',
  limit: 10,
  startDate: '2025-09-01',
});

// Create new transaction
const { transaction } = await createTransaction({
  user_id: userId,
  type: 'expense',
  category: 'Food & Dining',
  title: 'Coffee Shop',
  amount: 5.50,
  date: new Date().toISOString(),
});

// Update transaction
const { transaction } = await updateTransaction(transactionId, {
  amount: 6.00,
  note: 'Updated amount',
});
```

### Todos
```typescript
import { getTodos, createTodo, toggleTodo, updateTodo } from './supabase/client-examples';

// Get user's todos
const { todos } = await getTodos(userId, {
  done: false,
  priority: 'high',
});

// Create new todo
const { todo } = await createTodo({
  user_id: userId,
  title: 'Buy groceries',
  description: 'Weekly grocery shopping',
  priority: 'medium',
  due: '2025-09-10T18:00:00Z',
  tags: ['shopping', 'food'],
});

// Toggle todo completion
await toggleTodo(todoId, true);
```

### Categories
```typescript
import { getCategories, createCategory } from './supabase/client-examples';

// Get user's categories
const { categories } = await getCategories(userId, 'expense');

// Create new category
const { category } = await createCategory({
  user_id: userId,
  name: 'Gym & Fitness',
  type: 'expense',
  icon: 'Dumbbell',
  color: '#10B981',
  budget: 100.00,
});
```

---

## 🔄 Real-time Features

```typescript
import { subscribeToTransactions, subscribeToTodos } from './supabase/client-examples';

// Subscribe to transaction changes
const transactionSub = subscribeToTransactions(userId, (payload) => {
  console.log('Transaction changed:', payload);
  // Update your UI here
});

// Subscribe to todo changes  
const todoSub = subscribeToTodos(userId, (payload) => {
  console.log('Todo changed:', payload);
  // Update your UI here
});

// Don't forget to unsubscribe when component unmounts
// transactionSub.unsubscribe();
// todoSub.unsubscribe();
```

---

## ✅ Testing Checklist

### In Supabase Dashboard:

#### 1. **Authentication**
- [ ] User can sign up with email/password
- [ ] User can sign in successfully  
- [ ] User profile is auto-created on signup
- [ ] User can sign out

#### 2. **Profiles**
- [ ] User can view their own profile
- [ ] User can update username and currency
- [ ] User cannot access other users' profiles
- [ ] Profile trigger creates entry on user signup

#### 3. **Transactions**
- [ ] User can create income/expense transactions
- [ ] User can view only their own transactions
- [ ] User can update/delete their transactions
- [ ] User cannot access other users' transactions
- [ ] Filters work (type, category, date range)

#### 4. **Todos**
- [ ] User can create todos with all fields
- [ ] User can mark todos as complete/incomplete
- [ ] User can update todo priority and due dates
- [ ] User can filter todos by status and priority
- [ ] Tags array field works correctly

#### 5. **Categories**
- [ ] User can create expense/income categories
- [ ] User can set budgets for categories
- [ ] User cannot duplicate category names per type
- [ ] User can update category details

#### 6. **Row Level Security**
- [ ] All tables have RLS enabled
- [ ] Users can only access their own data
- [ ] Policies prevent unauthorized access
- [ ] Anonymous users cannot access any data

#### 7. **Performance**
- [ ] Queries return quickly with indexes
- [ ] Real-time subscriptions work
- [ ] Large datasets paginate properly

---

## 📁 File Structure

```
/supabase/
├── schema.sql           # Complete database schema
├── rls-policies.sql     # Row Level Security policies  
├── seed-data.sql        # Sample data for testing
├── database.types.ts    # TypeScript type definitions
└── client-examples.ts   # Usage examples and functions

/utils/
└── supabase.ts         # Updated Supabase client config

/.env.example           # Environment variables template
```

---

## 🚨 Important Security Notes

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **RLS Policies**: All user data is protected by Row Level Security
3. **API Keys**: Only use the anon key in client-side code
4. **Validation**: Additional validation should be added in your app logic
5. **Backup**: Regular database backups are recommended for production

---

## 🔄 Migration from Dummy Data

Your existing frontend code should work with minimal changes:

1. **Replace mock functions** with Supabase client calls
2. **Add user authentication** checks before data operations
3. **Update type definitions** to include `user_id` fields
4. **Handle loading states** and error cases properly
5. **Add real-time subscriptions** for live updates

---

## 🆘 Troubleshooting

### Common Issues:

1. **"relation does not exist"** - Run the schema.sql file first
2. **"RLS policy violated"** - Check user is authenticated and owns the data
3. **"Environment variables missing"** - Ensure .env file is properly configured
4. **"Connection failed"** - Verify Supabase URL and API key are correct
5. **"Trigger not working"** - Check the profile auto-creation trigger was created

### Getting Help:

- 📖 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 🐛 [GitHub Issues](https://github.com/supabase/supabase/issues)

---

## 🎉 You're All Set!

Your Supabase backend is now ready for your Finance Todo app! The schema matches your dummy data structure exactly, so your frontend should integrate seamlessly with minimal changes.

**Next steps:**
1. Set up your Supabase project
2. Run the schema and seed data
3. Configure your environment variables
4. Start integrating the client examples into your app
5. Test thoroughly using the checklist above

Happy coding! 🚀