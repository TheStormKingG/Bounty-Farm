CREATE TABLE IF NOT EXISTS purchase_delivery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_name TEXT NOT NULL,
  date DATE NOT NULL,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  invoice_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'farmer',
  updated_by TEXT DEFAULT 'farmer'
);

CREATE INDEX IF NOT EXISTS idx_purchase_delivery_farm_name ON purchase_delivery(farm_name);
CREATE INDEX IF NOT EXISTS idx_purchase_delivery_date ON purchase_delivery(date);
CREATE INDEX IF NOT EXISTS idx_purchase_delivery_invoice_number ON purchase_delivery(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchase_delivery_farm_date ON purchase_delivery(farm_name, date);

COMMENT ON TABLE purchase_delivery IS 'Stores purchase delivery information including invoices and amounts';
COMMENT ON COLUMN purchase_delivery.invoice_number IS 'Invoice number for the purchase';
COMMENT ON COLUMN purchase_delivery.amount IS 'Amount of the purchase in dollars';
COMMENT ON COLUMN purchase_delivery.invoice_image_url IS 'URL to the uploaded invoice image';
