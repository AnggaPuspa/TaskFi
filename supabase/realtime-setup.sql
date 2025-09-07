-- ================================================================
-- REALTIME PUBLICATION SETUP
-- ================================================================
-- Enable Realtime for todos and transactions tables
alter publication supabase_realtime add table public.todos;
alter publication supabase_realtime add table public.transactions;

-- RLS policies for realtime subscriptions
create policy if not exists "todos_select_own" on public.todos
  for select using (user_id = auth.uid());

create policy if not exists "transactions_select_own" on public.transactions
  for select using (user_id = auth.uid());

-- Verify publication setup
SELECT 
  schemaname, 
  tablename 
FROM 
  pg_publication_tables 
WHERE 
  pubname = 'supabase_realtime';

-- Check if RLS is properly configured
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM 
  pg_policy 
  JOIN pg_class ON pg_policy.polrelid = pg_class.oid 
WHERE 
  relname IN ('transactions', 'todos');