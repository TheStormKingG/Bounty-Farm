-- Check current triggers and functions
-- Run this in Supabase SQL Editor to see what's currently active

-- Check all triggers on sales_dispatch table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'sales_dispatch';

-- Check all triggers on invoices table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'invoices';

-- Check all functions that might reference payment_status
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%payment_status%' 
AND routine_schema = 'public';

-- Check if payment_status column exists in invoices table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;
