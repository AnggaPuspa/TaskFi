-- ================================================================
-- SEED DATA FOR FINANCE TODO APP
-- ================================================================
-- Sample data based on your dummy files for testing
-- ================================================================
-- NOTE: Replace '00000000-0000-0000-0000-000000000000' with actual user IDs
-- ================================================================

-- ================================================================
-- SAMPLE USER PROFILES
-- ================================================================
-- These will be created automatically when users sign up via the trigger
-- But you can insert test profiles manually for development

-- Example profile (replace with actual auth user ID)
INSERT INTO profiles (id, username, avatar_url, currency, created_at) 
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'testuser',
    'https://avatar.placeholder.com/150',
    'IDR',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- SAMPLE CATEGORIES
-- ================================================================
-- Income categories
INSERT INTO categories (user_id, name, type, icon, color, budget, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'Salary', 'income', 'Briefcase', '#10B981', 5000.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Freelance', 'income', 'Code', '#3B82F6', NULL, NOW()),
('00000000-0000-0000-0000-000000000000', 'Investment', 'income', 'TrendingUp', '#8B5CF6', NULL, NOW()),
('00000000-0000-0000-0000-000000000000', 'Bonus', 'income', 'Gift', '#F59E0B', NULL, NOW());

-- Expense categories  
INSERT INTO categories (user_id, name, type, icon, color, budget, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'Food & Dining', 'expense', 'UtensilsCrossed', '#EF4444', 500.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Transportation', 'expense', 'Car', '#6366F1', 300.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Shopping', 'expense', 'ShoppingBag', '#EC4899', 400.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Bills & Utilities', 'expense', 'Receipt', '#84CC16', 800.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Entertainment', 'expense', 'Gamepad2', '#F97316', 200.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Health & Fitness', 'expense', 'Heart', '#06B6D4', 150.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Education', 'expense', 'GraduationCap', '#8B5CF6', 300.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Travel', 'expense', 'Plane', '#10B981', 600.00, NOW()),
('00000000-0000-0000-0000-000000000000', 'Other', 'expense', 'MoreHorizontal', '#6B7280', NULL, NOW());

-- ================================================================
-- SAMPLE TRANSACTIONS
-- ================================================================
-- Income transactions
INSERT INTO transactions (user_id, type, category, title, note, amount, date, wallet, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'income', 'Salary', 'Monthly Salary', NULL, 4500.00, '2025-09-01 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'income', 'Freelance', 'Web Development Project', 'Client payment for website redesign', 850.00, '2025-09-03 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'income', 'Investment', 'Stock Dividends', NULL, 150.00, '2025-08-15 00:00:00+00', 'Investment Account', NOW());

-- Expense transactions
INSERT INTO transactions (user_id, type, category, title, note, amount, date, wallet, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'expense', 'Food & Dining', 'Grocery Shopping', 'Weekly groceries from supermarket', 85.50, '2025-09-06 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Transportation', 'Gas Station', NULL, 45.00, '2025-09-05 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Food & Dining', 'Coffee Shop', NULL, 12.75, '2025-09-04 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Bills & Utilities', 'Internet Bill', NULL, 79.99, '2025-09-02 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Shopping', 'Online Purchase', 'New headphones from Amazon', 125.00, '2025-09-01 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Entertainment', 'Movie Theater', NULL, 28.50, '2025-08-31 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Health & Fitness', 'Gym Membership', NULL, 49.99, '2025-08-30 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Food & Dining', 'Restaurant Dinner', 'Date night at Italian restaurant', 67.80, '2025-08-29 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Bills & Utilities', 'Rent Payment', NULL, 1200.00, '2025-08-01 00:00:00+00', 'Main Wallet', NOW()),
('00000000-0000-0000-0000-000000000000', 'expense', 'Bills & Utilities', 'Electricity Bill', NULL, 89.45, '2025-08-03 00:00:00+00', 'Main Wallet', NOW());

-- ================================================================
-- SAMPLE TODOS
-- ================================================================
-- Active todos
INSERT INTO todos (user_id, title, description, done, priority, due, tags, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'Review monthly budget', 'Analyze spending patterns and adjust budget categories for next month', false, 'high', '2025-09-07 23:59:59+00', ARRAY['finance', 'monthly'], NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', 'Pay credit card bill', 'Due date is approaching, pay the full balance', false, 'high', '2025-09-08 23:59:59+00', ARRAY['bills', 'urgent'], NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000000', 'Grocery shopping', 'Buy weekly groceries - milk, bread, fruits, vegetables', false, 'medium', '2025-09-08 18:00:00+00', ARRAY['shopping', 'food'], NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000000', 'Submit expense reports', 'Submit work-related expense reports for reimbursement', false, 'medium', '2025-09-09 17:00:00+00', ARRAY['work', 'finance'], NOW() - INTERVAL '4 days'),
('00000000-0000-0000-0000-000000000000', 'Call insurance agent', 'Discuss policy renewal options and potential discounts', false, 'low', '2025-09-10 12:00:00+00', ARRAY['insurance', 'phone'], NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000000', 'Research investment options', 'Look into index funds and ETFs for long-term investment', false, 'medium', '2025-09-14 00:00:00+00', ARRAY['investment', 'research'], NOW() - INTERVAL '6 days'),
('00000000-0000-0000-0000-000000000000', 'Schedule car maintenance', 'Oil change and general checkup due soon', false, 'low', '2025-09-12 10:00:00+00', ARRAY['car', 'maintenance'], NOW() - INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000000', 'Update emergency fund', 'Transfer money to emergency savings account', false, 'medium', '2025-09-11 00:00:00+00', ARRAY['savings', 'emergency'], NOW() - INTERVAL '8 days');

-- Completed todos
INSERT INTO todos (user_id, title, description, done, priority, due, tags, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000000', 'Set up automatic bill payments', 'Configure autopay for utilities and subscriptions', true, 'high', NULL, ARRAY['bills', 'automation'], NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', 'Download tax documents', 'Get W-2 and 1099 forms from employers', true, 'medium', NULL, ARRAY['taxes', 'documents'], NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000000', 'Cancel unused subscriptions', 'Review and cancel streaming services not being used', true, 'low', NULL, ARRAY['subscriptions', 'savings'], NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days');

-- Overdue todo
INSERT INTO todos (user_id, title, description, done, priority, due, tags, created_at) VALUES
('00000000-0000-0000-0000-000000000000', 'File tax return', 'Complete and submit tax return for this year', false, 'high', '2025-09-05 23:59:59+00', ARRAY['taxes', 'overdue'], NOW() - INTERVAL '20 days');

-- ================================================================
-- DATA VERIFICATION QUERIES
-- ================================================================
-- Use these queries to verify your data was inserted correctly

/*
-- Check profiles
SELECT * FROM profiles;

-- Check categories
SELECT * FROM categories ORDER BY type, name;

-- Check transactions
SELECT t.*, c.name as category_name 
FROM transactions t
LEFT JOIN categories c ON c.name = t.category AND c.user_id = t.user_id
ORDER BY t.date DESC;

-- Check todos
SELECT * FROM todos ORDER BY 
    CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END, 
    due ASC NULLS LAST;

-- Summary statistics
SELECT 
    'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL  
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Todos', COUNT(*) FROM todos;
*/