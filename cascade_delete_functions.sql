-- Cascade Delete Functions for BFLOS System
-- This script creates functions to handle cascade deletion of related records

-- Function to delete a PO and all related records
CREATE OR REPLACE FUNCTION delete_po_cascade(po_number_param TEXT)
RETURNS VOID AS $$
DECLARE
    invoice_number TEXT;
    dispatch_number TEXT;
    dispatch_id UUID;
BEGIN
    -- Generate invoice and dispatch numbers from PO number
    invoice_number := REPLACE(po_number_param, '-PO', '-INV');
    dispatch_number := REPLACE(po_number_param, '-PO', '-DISP');
    
    -- Get dispatch ID for received_dispatches deletion
    SELECT id INTO dispatch_id FROM dispatches WHERE dispatch_number = dispatch_number_param;
    
    -- Delete in reverse order of dependencies
    -- 1. Delete received_dispatches (if exists)
    IF dispatch_id IS NOT NULL THEN
        DELETE FROM received_dispatches WHERE dispatch_id = dispatch_id;
    END IF;
    
    -- 2. Delete dispatches
    DELETE FROM dispatches WHERE dispatch_number = dispatch_number;
    
    -- 3. Delete invoices
    DELETE FROM invoices WHERE invoice_number = invoice_number;
    
    -- 4. Delete sales_dispatch (PO)
    DELETE FROM sales_dispatch WHERE po_number = po_number_param;
    
    RAISE NOTICE 'Successfully deleted PO % and all related records', po_number_param;
END;
$$ LANGUAGE plpgsql;

-- Function to delete an invoice and all related records
CREATE OR REPLACE FUNCTION delete_invoice_cascade(invoice_number_param TEXT)
RETURNS VOID AS $$
DECLARE
    dispatch_number TEXT;
    dispatch_id UUID;
BEGIN
    -- Generate dispatch number from invoice number
    dispatch_number := REPLACE(invoice_number_param, '-INV', '-DISP');
    
    -- Get dispatch ID for received_dispatches deletion
    SELECT id INTO dispatch_id FROM dispatches WHERE dispatch_number = dispatch_number;
    
    -- Delete in reverse order of dependencies
    -- 1. Delete received_dispatches (if exists)
    IF dispatch_id IS NOT NULL THEN
        DELETE FROM received_dispatches WHERE dispatch_id = dispatch_id;
    END IF;
    
    -- 2. Delete dispatches
    DELETE FROM dispatches WHERE dispatch_number = dispatch_number;
    
    -- 3. Delete invoices
    DELETE FROM invoices WHERE invoice_number = invoice_number_param;
    
    RAISE NOTICE 'Successfully deleted invoice % and all related records', invoice_number_param;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a dispatch and all related records
CREATE OR REPLACE FUNCTION delete_dispatch_cascade(dispatch_number_param TEXT)
RETURNS VOID AS $$
DECLARE
    dispatch_id UUID;
BEGIN
    -- Get dispatch ID for received_dispatches deletion
    SELECT id INTO dispatch_id FROM dispatches WHERE dispatch_number = dispatch_number_param;
    
    -- Delete in reverse order of dependencies
    -- 1. Delete received_dispatches (if exists)
    IF dispatch_id IS NOT NULL THEN
        DELETE FROM received_dispatches WHERE dispatch_id = dispatch_id;
    END IF;
    
    -- 2. Delete dispatches
    DELETE FROM dispatches WHERE dispatch_number = dispatch_number_param;
    
    RAISE NOTICE 'Successfully deleted dispatch % and all related records', dispatch_number_param;
END;
$$ LANGUAGE plpgsql;

-- Function to delete a received dispatch
CREATE OR REPLACE FUNCTION delete_received_dispatch_cascade(dispatch_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete received_dispatches
    DELETE FROM received_dispatches WHERE dispatch_id = dispatch_id_param;
    
    RAISE NOTICE 'Successfully deleted received dispatch for dispatch_id %', dispatch_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key constraints with CASCADE DELETE where appropriate
-- Note: These should be added carefully as they will automatically delete related records

-- Add foreign key constraint for dispatches -> invoices (with CASCADE DELETE)
-- ALTER TABLE dispatches 
-- ADD CONSTRAINT fk_dispatches_invoice_id 
-- FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- Add foreign key constraint for received_dispatches -> dispatches (with CASCADE DELETE)
-- ALTER TABLE received_dispatches 
-- ADD CONSTRAINT fk_received_dispatches_dispatch_id 
-- FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE;

-- Example usage:
-- SELECT delete_po_cascade('BFLOS-001-PO');
-- SELECT delete_invoice_cascade('BFLOS-001-INV');
-- SELECT delete_dispatch_cascade('BFLOS-001-DISP');
-- SELECT delete_received_dispatch_cascade('dispatch-uuid-here');
