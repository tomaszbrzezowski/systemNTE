/*
  # Create seat layout templates and seat assignments tables
  
  1. New Tables
    - `seat_layout_templates`
      - Stores hall layout templates for events
      - Links to halls and events
      - Stores layout data as JSON
    - `seat_assignments`
      - Stores seat assignments for events
      - Links to events
      - Stores school name and seat status
      
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create seat_layout_templates table
CREATE TABLE IF NOT EXISTS seat_layout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid REFERENCES halls(id) ON DELETE CASCADE,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  layout_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hall_id, event_id)
);

-- Create seat_assignments table
CREATE TABLE IF NOT EXISTS seat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id text NOT NULL,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('reserved', 'booked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(seat_id, event_id)
);

-- Enable RLS
ALTER TABLE seat_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users"
  ON seat_layout_templates
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

-- Create updated_at triggers
CREATE TRIGGER update_seat_layout_templates_updated_at
  BEFORE UPDATE ON seat_layout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seat_assignments_updated_at
  BEFORE UPDATE ON seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_seat_layout_templates_hall_id ON seat_layout_templates(hall_id);
CREATE INDEX idx_seat_layout_templates_event_id ON seat_layout_templates(event_id);
CREATE INDEX idx_seat_assignments_event_id ON seat_assignments(event_id);