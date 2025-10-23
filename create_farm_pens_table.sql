CREATE TABLE IF NOT EXISTS farm_pens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES farm_customers(id) ON DELETE CASCADE,
  pen_number INTEGER NOT NULL,
  length_meters DECIMAL(10,2) NOT NULL,
  width_meters DECIMAL(10,2) NOT NULL,
  area_square_meters DECIMAL(10,2) NOT NULL,
  min_birds INTEGER NOT NULL,
  max_birds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin',
  updated_by TEXT DEFAULT 'admin',
  UNIQUE (farm_id, pen_number)
);

CREATE INDEX IF NOT EXISTS idx_farm_pens_farm_id ON farm_pens(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_pens_pen_number ON farm_pens(farm_id, pen_number);

COMMENT ON TABLE farm_pens IS 'Stores pen dimensions and capacity information for each farm';
COMMENT ON COLUMN farm_pens.pen_number IS 'Pen number within the farm';
COMMENT ON COLUMN farm_pens.length_meters IS 'Length of the pen in meters';
COMMENT ON COLUMN farm_pens.width_meters IS 'Width of the pen in meters';
COMMENT ON COLUMN farm_pens.area_square_meters IS 'Calculated area in square meters';
COMMENT ON COLUMN farm_pens.min_birds IS 'Minimum number of birds that can fit';
COMMENT ON COLUMN farm_pens.max_birds IS 'Maximum number of birds that can fit';

-- Insert sample pen data for Bounty 4 farm
INSERT INTO farm_pens (farm_id, pen_number, length_meters, width_meters, area_square_meters, min_birds, max_birds)
SELECT 
  id as farm_id,
  1 as pen_number,
  10.0 as length_meters,
  5.0 as width_meters,
  50.0 as area_square_meters,
  455 as min_birds,
  4166 as max_birds
FROM farm_customers 
WHERE farm_name = 'Bounty 4'
ON CONFLICT (farm_id, pen_number) DO NOTHING;
