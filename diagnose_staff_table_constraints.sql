-- Diagnostic script to check staff_table constraints and structure
-- Run this in Supabase SQL Editor

-- 1) Check current constraints on staff_table
SELECT 'Current constraints on staff_table:' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.staff_table'::regclass;

-- 2) Check the role column definition
SELECT 'Role column definition:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'staff_table' 
AND table_schema = 'public'
AND column_name = 'role';

-- 3) Check what roles currently exist in the table
SELECT 'Existing roles in staff_table:' as info;
SELECT DISTINCT role, COUNT(*) as count
FROM public.staff_table
GROUP BY role
ORDER BY role;

-- 4) Check if we can see the constraint definition more clearly
SELECT 'Constraint details:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'staff_table'
AND tc.table_schema = 'public'
AND tc.constraint_type = 'CHECK';
