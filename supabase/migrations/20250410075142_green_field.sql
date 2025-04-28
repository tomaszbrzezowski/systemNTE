/*
  # Update Hall Layout System
  
  1. Changes
    - Add layout_blocks column to calendar_events table if it doesn't exist
    - Create seat_assignments table if it doesn't exist
    - Create seat_layout_templates table if it doesn't exist
    - Add proper indexes and constraints
    
  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add layout_blocks column to calendar_events table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'layout_blocks'
  ) THEN
    ALTER TABLE calendar_events
    ADD COLUMN layout_blocks JSONB DEFAULT NULL;
    
    -- Add comment explaining purpose
    COMMENT ON COLUMN calendar_events.layout_blocks IS 'Stores hall layout blocks data in JSON format';
  END IF;
END $$;

-- Create seat_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS seat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id text NOT NULL,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('reserved', 'booked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(seat_id, event_id)
);

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

-- Enable RLS on new tables
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_layout_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seat_assignments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'seat_assignments' AND policyname = 'Enable all operations for authenticated users'
  ) THEN
    CREATE POLICY "Enable all operations for authenticated users"
      ON seat_assignments
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create RLS policies for seat_layout_templates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'seat_layout_templates' AND policyname = 'Enable all operations for authenticated users'
  ) THEN
    CREATE POLICY "Enable all operations for authenticated users"
      ON seat_layout_templates
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create updated_at triggers if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_seat_assignments_updated_at'
  ) THEN
    CREATE TRIGGER update_seat_assignments_updated_at
      BEFORE UPDATE ON seat_assignments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

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
CREATE INDEX IF NOT EXISTS idx_seat_assignments_event_id ON seat_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_layout_templates_hall_id ON seat_layout_templates(hall_id);
CREATE INDEX IF NOT EXISTS idx_seat_layout_templates_event_id ON seat_layout_templates(event_id);