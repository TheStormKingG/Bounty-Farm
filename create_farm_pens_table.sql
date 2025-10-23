CREATE TABLE IF NOT EXISTS farm_pens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id TEXT NOT NULL,
  pen_number INTEGER NOT NULL,
  length_meters DECIMAL(10,2) NOT NULL,
  width_meters DECIMAL(10,2) NOT NULL,
  area_square_meters DECIMAL(10,2) NOT NULL,
  min_birds INTEGER NOT NULL,
  max_birds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'admin',
  updated_by TEXT DEFAULT 'admin'
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
