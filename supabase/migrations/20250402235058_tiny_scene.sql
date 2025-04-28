/*
  # Create seat layout templates table
  
  1. Changes
    - Create seat_layout_templates table if it doesn't exist
    - Add proper columns and constraints
    - Add RLS policies
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create seat_layout_templates table if it doesn't exist
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

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON seat_layout_templates;
END $$;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users"
  ON seat_layout_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_seat_layout_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_seat_layout_templates_updated_at
      BEFORE UPDATE ON seat_layout_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seat_layout_templates_hall_id ON seat_layout_templates(hall_id);
CREATE INDEX IF NOT EXISTS idx_seat_layout_templates_event_id ON seat_layout_templates(event_id);