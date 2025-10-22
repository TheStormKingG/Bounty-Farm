-- Add status column to dispatches table
-- This script adds the status column that the application expects

-- Add status column to dispatches table
ALTER TABLE dispatches 
ADD COLUMN status TEXT DEFAULT 'pending';

-- Add CHECK constraint for valid status values
ALTER TABLE dispatches 
ADD CONSTRAINT chk_dispatches_status CHECK (status IN ('pending', 'received'));

-- Update existing rows to have a default status
UPDATE dispatches 
SET status = 'pending' 
WHERE status IS NULL;

-- Add index for better performance on status queries
CREATE INDEX idx_dispatches_status ON dispatches(status);

-- Add index for better performance on dispatch_number queries
CREATE INDEX idx_dispatches_dispatch_number ON dispatches(dispatch_number);
