-- Simple fix for staff_table role constraint
-- Run this in Supabase SQL Editor

-- Drop the existing role check constraint
ALTER TABLE public.staff_table DROP CONSTRAINT IF EXISTS staff_table_role_check;

-- Add the new constraint that includes all valid roles including Farmer
ALTER TABLE public.staff_table 
ADD CONSTRAINT staff_table_role_check 
CHECK (role IN ('Admin', 'HatcheryClerk', 'SalesClerk', 'Farmer', 'User'));

-- Verify the constraint was added
SELECT 'Constraint updated successfully' as status;
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'staff_table_role_check';
