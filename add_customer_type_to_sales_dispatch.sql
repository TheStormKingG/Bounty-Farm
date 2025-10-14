-- Add customer_type column to sales_dispatch table
-- This script adds the customer_type column to store whether the customer is 'Farm' or 'Individual'

-- Add the customer_type column
ALTER TABLE sales_dispatch 
ADD COLUMN customer_type TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN sales_dispatch.customer_type IS 'Customer type: Farm or Individual';

-- Update existing records to have a default value (optional)
-- You can uncomment the line below if you want to set a default value for existing records
-- UPDATE sales_dispatch SET customer_type = 'Farm' WHERE customer_type IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_dispatch' 
AND column_name = 'customer_type';
