-- ================================================================
-- ADD SETTINGS FEATURES TO EXISTING SCHEMA
-- ================================================================
-- This migration adds support for:
-- 1. Profile enhancements (display_name, language, app_lock_enabled)
-- 2. Reminders table for notifications
-- 3. Storage bucket for avatars
-- ================================================================

-- ================================================================
-- STEP 1: UPDATE PROFILES TABLE
-- ================================================================
-- Add new columns for settings features
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' NOT NULL,
ADD COLUMN IF NOT EXISTS app_lock_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS surname TEXT;

-- ================================================================
-- STEP 2: CREATE REMINDERS TABLE
-- ================================================================
-- Table for storing notification reminders
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('daily_expense', 'todo_due')),
    title TEXT NOT NULL,
    body TEXT,
    time TIME NOT NULL, -- Time of day to trigger (e.g., '21:00:00' for 9 PM)
    timezone TEXT NOT NULL DEFAULT 'UTC',
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    notification_id TEXT, -- Store expo notification identifier
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Reminders RLS Policy
CREATE POLICY "Users can CRUD own reminders"
    ON reminders FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders(enabled);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(type);

-- ================================================================
-- STEP 3: ADD TRIGGER FOR REMINDERS TABLE
-- ================================================================
-- Apply auto-update trigger to reminders table
CREATE TRIGGER update_reminders_updated_at 
    BEFORE UPDATE ON reminders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 4: CREATE STORAGE BUCKET FOR AVATARS
-- ================================================================
-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 5: STORAGE RLS POLICIES FOR AVATARS
-- ================================================================
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to view their own avatars
CREATE POLICY "Users can view own avatar" 
    ON storage.objects FOR SELECT 
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar" 
    ON storage.objects FOR UPDATE 
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ================================================================
-- STEP 6: UPDATE PROFILE AUTO-CREATION FUNCTION
-- ================================================================
-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url, currency, display_name, language, app_lock_enabled)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'currency', 'IDR'),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
        COALESCE((NEW.raw_user_meta_data->>'app_lock_enabled')::boolean, false)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
