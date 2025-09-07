-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================
-- Comprehensive RLS policies for multi-tenant security
-- ================================================================

-- ================================================================
-- PROFILES POLICIES
-- ================================================================
-- Note: These are already included in schema.sql but listed here for reference

-- Allow users to view their own profile
-- CREATE POLICY "Users can view own profile" 
--     ON profiles FOR SELECT 
--     USING (auth.uid() = id);

-- Allow users to update their own profile
-- CREATE POLICY "Users can update own profile" 
--     ON profiles FOR UPDATE 
--     USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (handled by trigger)
-- CREATE POLICY "Users can insert own profile" 
--     ON profiles FOR INSERT 
--     WITH CHECK (auth.uid() = id);

-- ================================================================
-- TRANSACTIONS POLICIES
-- ================================================================
-- Note: This is already included in schema.sql but listed here for reference

-- Comprehensive policy for all CRUD operations on transactions
-- CREATE POLICY "Users can CRUD own transactions"
--     ON transactions FOR ALL
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);

-- Alternative: Separate policies for each operation (more granular control)
-- Uncomment these if you prefer separate policies instead of the ALL policy above

/*
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);
*/

-- ================================================================
-- TODOS POLICIES
-- ================================================================
-- Note: This is already included in schema.sql but listed here for reference

-- Comprehensive policy for all CRUD operations on todos
-- CREATE POLICY "Users can CRUD own todos"
--     ON todos FOR ALL
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);

-- Alternative: Separate policies for each operation
-- Uncomment these if you prefer separate policies instead of the ALL policy above

/*
CREATE POLICY "Users can view own todos"
    ON todos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos"
    ON todos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
    ON todos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
    ON todos FOR DELETE
    USING (auth.uid() = user_id);
*/

-- ================================================================
-- CATEGORIES POLICIES
-- ================================================================
-- Note: This is already included in schema.sql but listed here for reference

-- Comprehensive policy for all CRUD operations on categories
-- CREATE POLICY "Users can CRUD own categories"
--     ON categories FOR ALL
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);

-- Alternative: Global categories approach (if you want shared categories)
-- Uncomment these if you prefer global categories that all users can read

/*
-- Drop the existing policy first
DROP POLICY IF EXISTS "Users can CRUD own categories" ON categories;

-- Allow all users to read categories
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

-- Only allow admins to modify categories (replace with actual admin check)
CREATE POLICY "Admins can modify categories"
    ON categories FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');
*/

-- ================================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- ================================================================

-- Function to check if user owns a resource
CREATE OR REPLACE FUNCTION public.user_owns_resource(resource_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS profiles AS $$
DECLARE
    profile profiles;
BEGIN
    SELECT * INTO profile 
    FROM profiles 
    WHERE id = auth.uid();
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- TESTING RLS POLICIES
-- ================================================================
-- You can test these policies in the Supabase SQL editor:

/*
-- Test as authenticated user (replace with actual user ID)
SELECT set_config('request.jwt.claims', '{"sub":"user-uuid-here"}', true);

-- These should work (user's own data)
SELECT * FROM transactions WHERE user_id = 'user-uuid-here';
SELECT * FROM todos WHERE user_id = 'user-uuid-here';

-- These should return empty (other user's data)
SELECT * FROM transactions WHERE user_id = 'different-user-uuid';
SELECT * FROM todos WHERE user_id = 'different-user-uuid';
*/