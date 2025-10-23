-- Create Feed Delivery table
CREATE TABLE IF NOT EXISTS feed_delivery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flock_id TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Feed Delivery fields
  feed_type TEXT NOT NULL CHECK (feed_type IN ('Starter', 'Grower', 'Finisher')),
  number_of_bags INTEGER NOT NULL CHECK (number_of_bags > 0),
  delivery_number INTEGER NOT NULL CHECK (delivery_number > 0),
  delivery_image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'farmer',
  updated_by TEXT DEFAULT 'farmer'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feed_delivery_flock_id ON feed_delivery(flock_id);
CREATE INDEX IF NOT EXISTS idx_feed_delivery_date ON feed_delivery(date);
CREATE INDEX IF NOT EXISTS idx_feed_delivery_flock_date ON feed_delivery(flock_id, date);
CREATE INDEX IF NOT EXISTS idx_feed_delivery_type ON feed_delivery(feed_type);

-- Create unique constraint to prevent duplicate entries for same flock, date, and delivery number
CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_delivery_flock_date_delivery_unique 
ON feed_delivery(flock_id, date, delivery_number);

-- Add comments for documentation
COMMENT ON TABLE feed_delivery IS 'Stores feed delivery data for flocks';
COMMENT ON COLUMN feed_delivery.feed_type IS 'Type of feed delivered: Starter, Grower, or Finisher';
COMMENT ON COLUMN feed_delivery.number_of_bags IS 'Number of feed bags delivered';
COMMENT ON COLUMN feed_delivery.delivery_number IS 'Delivery number for tracking purposes';
COMMENT ON COLUMN feed_delivery.delivery_image_url IS 'URL to uploaded delivery image';
