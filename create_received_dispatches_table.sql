-- Create received_dispatches table for cross-device persistence
CREATE TABLE IF NOT EXISTS received_dispatches (
  id SERIAL PRIMARY KEY,
  farm_name VARCHAR(255) NOT NULL,
  dispatch_id UUID NOT NULL,
  dispatch_number VARCHAR(255) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  trip_distribution JSONB,
  placements JSONB,
  pen_flock_summary JSONB,
  confirmed_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_received_dispatches_farm_name ON received_dispatches(farm_name);
CREATE INDEX IF NOT EXISTS idx_received_dispatches_dispatch_id ON received_dispatches(dispatch_id);

-- Enable RLS
ALTER TABLE received_dispatches ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is internal data)
CREATE POLICY "Allow all operations on received_dispatches" ON received_dispatches
  FOR ALL USING (true);
