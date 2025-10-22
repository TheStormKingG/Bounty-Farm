-- Add missing columns to received_dispatches table
-- This script adds the columns that the application expects but are missing from the database schema

-- Add edit_count column (integer, default 0)
ALTER TABLE received_dispatches 
ADD COLUMN edit_count INTEGER DEFAULT 0;

-- Add placements column (JSONB to store placement data)
ALTER TABLE received_dispatches 
ADD COLUMN placements JSONB;

-- Add pen_flock_summary column (JSONB to store pen/flock summary data)
ALTER TABLE received_dispatches 
ADD COLUMN pen_flock_summary JSONB;

-- Add confirmed_by column (text to store who confirmed the receipt)
ALTER TABLE received_dispatches 
ADD COLUMN confirmed_by TEXT;

-- Add updated_at column (timestamp with timezone)
ALTER TABLE received_dispatches 
ADD COLUMN updated_at TIMESTAMPTZ;

-- Add status column (text, default 'Confirmed')
ALTER TABLE received_dispatches 
ADD COLUMN status TEXT DEFAULT 'Confirmed';

-- Add CHECK constraint for status column to ensure valid values
ALTER TABLE received_dispatches 
ADD CONSTRAINT chk_received_dispatches_status CHECK (status IN ('Confirmed', 'Pending'));

-- Update existing rows to have default values for new columns
UPDATE received_dispatches 
SET 
  edit_count = 0,
  confirmed_by = 'System',
  updated_at = confirmed_at,
  status = 'Confirmed'
WHERE edit_count IS NULL OR confirmed_by IS NULL OR updated_at IS NULL OR status IS NULL;
