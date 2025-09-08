-- ================================================================
-- RECEIPTS TABLE MIGRATION FOR OCR FEATURE
-- ================================================================
-- Table for storing OCR-scanned receipt data
-- ================================================================

-- ================================================================
-- STEP 1: CREATE RECEIPTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- File storage
    storage_path TEXT, -- Optional: path to saved image in Supabase Storage
    
    -- OCR Results
    ocr_text TEXT NOT NULL, -- Raw OCR text output
    
    -- Parsed Data
    merchant TEXT, -- Extracted merchant/store name
    total_amount NUMERIC(14,2), -- Extracted total amount
    currency TEXT DEFAULT 'IDR' NOT NULL,
    purchase_date DATE, -- Extracted purchase date
    
    -- Processing Status
    status TEXT DEFAULT 'parsed' CHECK (status IN ('pending', 'parsed', 'confirmed', 'failed')) NOT NULL,
    confidence_score REAL, -- OCR confidence (0.0 to 1.0)
    
    -- Metadata
    device_info JSONB, -- Device used for scanning
    processing_time_ms INTEGER, -- OCR processing time
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 3: CREATE RLS POLICIES
-- ================================================================
-- Users can only access their own receipts
CREATE POLICY "Users can CRUD own receipts"
    ON receipts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_purchase_date ON receipts(purchase_date DESC);

-- ================================================================
-- STEP 5: CREATE STORAGE BUCKET FOR RECEIPT IMAGES
-- ================================================================
-- Create storage bucket for receipt images (optional feature)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 6: STORAGE RLS POLICIES
-- ================================================================
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own receipt images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to view their own receipt images
CREATE POLICY "Users can view own receipt images"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own receipt images
CREATE POLICY "Users can delete own receipt images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'receipts' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ================================================================
-- STEP 7: CREATE UPDATED_AT TRIGGER
-- ================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_receipts_updated_at ON receipts;
CREATE TRIGGER trigger_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_receipts_updated_at();

-- ================================================================
-- STEP 8: CREATE HELPFUL VIEWS
-- ================================================================
-- View for receipt summaries with stats
CREATE VIEW receipt_summaries AS
SELECT 
    user_id,
    COUNT(*) as total_receipts,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_receipts,
    SUM(total_amount) FILTER (WHERE status = 'confirmed') as total_spent,
    AVG(confidence_score) as avg_confidence,
    MIN(created_at) as first_receipt,
    MAX(created_at) as last_receipt
FROM receipts
GROUP BY user_id;

-- ================================================================
-- STEP 9: SAMPLE DATA (for testing)
-- ================================================================
-- Insert sample receipt (uncomment for testing)
/*
INSERT INTO receipts (
    user_id,
    ocr_text,
    merchant,
    total_amount,
    purchase_date,
    status,
    confidence_score
) VALUES (
    auth.uid(), -- Replace with actual user_id for testing
    'INDOMARET PEMUDA\nTanggal: 12/09/2025\nTotal: Rp 45.500\nTerima kasih',
    'INDOMARET PEMUDA',
    45500.00,
    '2025-09-12',
    'confirmed',
    0.89
);
*/
