-- Drop existing tables if they exist
DROP TABLE IF EXISTS seat_assignments CASCADE;
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
  total_seats integer DEFAULT 0,
  UNIQUE(hall_id)
);

-- Create layout_sections table
CREATE TABLE layout_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id uuid REFERENCES hall_layouts(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name IN ('PARTER', 'BALKON I', 'BALKON II', 'BALKON III', 'BALKON PRAWY I', 'BALKON PRAWY II', 'BALKON PRAWY III', 'BALKON LEWY I', 'BALKON LEWY II', 'BALKON LEWY III')),
  rows integer NOT NULL,
  row_seats integer[] NOT NULL,
  removed_seats jsonb DEFAULT '{}',
  seat_gaps jsonb DEFAULT '{}',
  empty_rows integer[] DEFAULT '{}',
  orientation text NOT NULL CHECK (orientation IN ('horizontal', 'vertical')),
  numbering_style text NOT NULL CHECK (numbering_style IN ('arabic', 'roman', 'letters')),
  numbering_direction text NOT NULL CHECK (numbering_direction IN ('ltr', 'rtl')),
  alignment text NOT NULL CHECK (alignment IN ('left', 'center', 'right')),
  position text NOT NULL CHECK (position IN ('center', 'left', 'right', 'back')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(layout_id, name)
);

-- Create seat_assignments table
CREATE TABLE seat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id uuid NOT NULL,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('reserved', 'booked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(seat_id, event_id)
);

-- Enable RLS
ALTER TABLE hall_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;

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
  ON seat_assignments
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

CREATE TRIGGER update_seat_assignments_updated_at
  BEFORE UPDATE ON seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update hall seats count
CREATE OR REPLACE FUNCTION update_hall_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_seats in hall_layouts
  UPDATE hall_layouts
  SET total_seats = (
    SELECT COALESCE(SUM(
      (SELECT SUM(unnest)
       FROM unnest(NEW.row_seats)
       WHERE ordinality NOT IN (
         SELECT UNNEST(NEW.empty_rows)
       )
      ) -
      (SELECT COUNT(*)
       FROM jsonb_object_keys(COALESCE(NEW.removed_seats, '{}'::jsonb))
      ) -
      (SELECT COUNT(*)
       FROM jsonb_object_keys(COALESCE(NEW.seat_gaps, '{}'::jsonb))
      )
    ), 0)
    FROM layout_sections
    WHERE layout_id = NEW.layout_id
  )
  WHERE id = NEW.layout_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating hall seats
CREATE TRIGGER update_hall_seats_trigger_v5
  AFTER INSERT OR DELETE OR UPDATE ON layout_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_seats();