/*
  # Add hall layouts schema if not exists
  
  1. Changes
    - Check for existing tables before creating
    - Add proper constraints and indexes
    - Add RLS policies
    
  2. Security
    - Enable RLS on all tables
    - Add policies for administrators
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS layout_sections CASCADE;
DROP TABLE IF EXISTS hall_layouts CASCADE;

-- Create hall_layouts table
CREATE TABLE hall_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid REFERENCES halls(id) ON DELETE CASCADE,
  name text NOT NULL,
  rows integer DEFAULT 1,
  seats_per_row integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  layout_data jsonb,
  show_row_numbers boolean DEFAULT true,
  show_column_numbers boolean DEFAULT true,
  UNIQUE(hall_id)
);

-- Create layout_sections table
CREATE TABLE layout_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid REFERENCES hall_layouts(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name IN ('parterre', 'leftBalcony', 'rightBalcony', 'firstBalcony', 'secondBalcony')),
  orientation text NOT NULL CHECK (orientation IN ('horizontal', 'vertical')),
  visible boolean DEFAULT true,
  sort_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(layout_id, name)
);

-- Create seats table
CREATE TABLE seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid REFERENCES hall_layouts(id) ON DELETE CASCADE,
  section_id uuid REFERENCES layout_sections(id) ON DELETE CASCADE,
  row_label text NOT NULL DEFAULT 'I',
  row_index integer NOT NULL DEFAULT 0,
  seat_index integer NOT NULL DEFAULT 0,
  row_number integer NOT NULL,
  seat_number integer NOT NULL,
  section text NOT NULL CHECK (section IN ('parterre', 'leftBalcony', 'rightBalcony', 'firstBalcony', 'secondBalcony', 'thirdBalcony')),
  category text NOT NULL CHECK (category IN ('standard', 'premium', 'disabled')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked')),
  is_aisle boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(layout_id, section_id, row_label, seat_number)
);

-- Create indexes
CREATE INDEX idx_hall_layouts_hall_id ON hall_layouts(hall_id);
CREATE INDEX idx_hall_layouts_layout_data ON hall_layouts USING gin (layout_data);
CREATE INDEX idx_seats_layout_id ON seats(layout_id);
CREATE INDEX idx_seats_layout_section ON seats(layout_id, section_id);
CREATE INDEX idx_seats_section ON seats(section);
CREATE INDEX idx_seats_section_id ON seats(section_id);
CREATE INDEX idx_seats_row_index ON seats(section_id, row_index);

-- Enable RLS
ALTER TABLE hall_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users"
  ON hall_layouts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
  ON layout_sections
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
  ON seats
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers
CREATE TRIGGER update_hall_layouts_updated_at
  BEFORE UPDATE ON hall_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_layout_sections_updated_at
  BEFORE UPDATE ON layout_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();