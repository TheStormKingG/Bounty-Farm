-- Ensure dispatches table has correct structure
-- This script creates the dispatches table with the proper columns

-- Create dispatches table if it doesn't exist
CREATE TABLE IF NOT EXISTS dispatches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispatch_number TEXT NOT NULL UNIQUE,
    invoice_id UUID REFERENCES invoices(id),
    sales_dispatch_id UUID REFERENCES sales_dispatch(id),
    date_dispatched DATE NOT NULL,
    type TEXT DEFAULT 'Delivery',
    trucks INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns if the table already exists
DO $$ 
BEGIN
    -- Add dispatch_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'dispatch_number') THEN
        ALTER TABLE dispatches ADD COLUMN dispatch_number TEXT;
    END IF;
    
    -- Add invoice_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'invoice_id') THEN
        ALTER TABLE dispatches ADD COLUMN invoice_id UUID;
    END IF;
    
    -- Add sales_dispatch_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'sales_dispatch_id') THEN
        ALTER TABLE dispatches ADD COLUMN sales_dispatch_id UUID;
    END IF;
    
    -- Add date_dispatched column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'date_dispatched') THEN
        ALTER TABLE dispatches ADD COLUMN date_dispatched DATE;
    END IF;
    
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'type') THEN
        ALTER TABLE dispatches ADD COLUMN type TEXT DEFAULT 'Delivery';
    END IF;
    
    -- Add trucks column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'trucks') THEN
        ALTER TABLE dispatches ADD COLUMN trucks INTEGER DEFAULT 1;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'created_by') THEN
        ALTER TABLE dispatches ADD COLUMN created_by TEXT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'created_at') THEN
        ALTER TABLE dispatches ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'updated_by') THEN
        ALTER TABLE dispatches ADD COLUMN updated_by TEXT;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'updated_at') THEN
        ALTER TABLE dispatches ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Remove trips column if it exists (this was causing the error)
ALTER TABLE dispatches DROP COLUMN IF EXISTS trips;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'dispatches'
ORDER BY ordinal_position;
