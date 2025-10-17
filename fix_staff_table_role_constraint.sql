-- Fix staff_table role constraint to include Farmer role
-- Run this in Supabase SQL Editor

-- First, let's see what the current constraint looks like
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'staff_table_role_check';

-- Drop the existing constraint
ALTER TABLE public.staff_table DROP CONSTRAINT IF EXISTS staff_table_role_check;

-- Add the new constraint that includes Farmer role
ALTER TABLE public.staff_table 
ADD CONSTRAINT staff_table_role_check 
CHECK (role IN ('Admin', 'HatcheryClerk', 'SalesClerk', 'Farmer', 'User'));

-- Verify the constraint was added correctly
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'staff_table_role_check';

-- Test by trying to insert a Farmer role (this should work now)
-- INSERT INTO public.staff_table (name, email, password, role) 
-- VALUES ('Test Farmer', 'test@bflos.com', 'test123', 'Farmer');

-- Clean up test record if it was inserted
-- DELETE FROM public.staff_table WHERE email = 'test@bflos.com';

SELECT 'Staff table role constraint updated successfully to include Farmer role' as status;
