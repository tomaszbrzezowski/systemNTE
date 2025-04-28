/*
  # Add seat layout templates table
  
  1. New Table
    - `seat_layout_templates`
      - Stores saved seat layout templates for halls
      - Links to halls and events
      - Stores layout data as JSON
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create seat_layout_templates table
CREATE TABLE IF NOT EXISTS seat_layout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid REFERENCES halls(id) ON DELETE CASCADE,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  layout_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hall_id, event_id)
);

-- Enable RLS
ALTER TABLE seat_layout_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users"
  ON seat_layout_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_seat_layout_templates_updated_at
  BEFORE UPDATE ON seat_layout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_seat_layout_templates_hall_id ON seat_layout_templates(hall_id);
CREATE INDEX idx_seat_layout_templates_event_id ON seat_layout_templates(event_id);