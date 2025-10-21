-- Debug script to check farm customers and their exact names
-- Run this in Supabase SQL Editor to see what farm customers exist

SELECT 
    id,
    farm_name,
    farm_address,
    contact_person,
    contact_number,
    created_at
FROM farm_customers 
ORDER BY created_at DESC;

-- Also check if there are any users with Farmer role
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM staff_table 
WHERE role = 'Farmer'
ORDER BY created_at DESC;
