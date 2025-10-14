-- Alternative: Manual invoice creation function
-- Use this if you prefer to create invoices manually rather than automatically

-- Function to manually create invoice from sales dispatch record
CREATE OR REPLACE FUNCTION create_invoice_manually(po_number_param VARCHAR(255))
RETURNS UUID AS $$
DECLARE
    sales_record RECORD;
    new_invoice_number VARCHAR(255);
    invoice_counter INTEGER;
    new_invoice_id UUID;
BEGIN
    -- Get the sales dispatch record
    SELECT * INTO sales_record
    FROM sales_dispatch
    WHERE po_number = po_number_param;
    
    -- Check if record exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sales dispatch record with PO number % not found', po_number_param;
    END IF;
    
    -- Generate invoice number
    new_invoice_number := REPLACE(sales_record.po_number, '-PO', '-INV');
    
    -- If the PO number doesn't follow the expected pattern, generate a sequential number
    IF new_invoice_number = sales_record.po_number THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
        INTO invoice_counter
        FROM invoices
        WHERE invoice_number LIKE 'INV-%';
        
        new_invoice_number := 'INV-' || LPAD(invoice_counter::TEXT, 4, '0');
    END IF;
    
    -- Insert new invoice record
    INSERT INTO invoices (
        invoice_number,
        date_sent,
        payment_status,
        created_by
    ) VALUES (
        new_invoice_number,
        sales_record.date_ordered,
        'pending',
        sales_record.created_by
    ) RETURNING id INTO new_invoice_id;
    
    RETURN new_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Usage example:
-- SELECT create_invoice_manually('BFLOS-007-PO');
