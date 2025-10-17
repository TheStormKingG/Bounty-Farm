-- SIMPLE DIAGNOSTIC AND CLEANUP
-- Run this in Supabase SQL Editor

-- 1) Check what triggers are currently active
SELECT 'ACTIVE TRIGGERS ON SALES_DISPATCH:' as info;
SELECT trigger_name, action_statement, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'sales_dispatch'
ORDER BY trigger_name;

SELECT 'ACTIVE TRIGGERS ON INVOICES:' as info;
SELECT trigger_name, action_statement, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'invoices'
ORDER BY trigger_name;

-- 2) Check what functions exist
SELECT 'ACTIVE FUNCTIONS:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 3) Check if payment_status column exists in invoices
SELECT 'INVOICES TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4) Check if payment_status column exists in dispatches
SELECT 'DISPATCHES TABLE COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'dispatches' 
AND table_schema = 'public'
ORDER BY ordinal_position;
