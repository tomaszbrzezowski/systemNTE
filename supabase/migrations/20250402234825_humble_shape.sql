/*
  # Fix seat assignments schema
  
  1. Changes
    - Update seat_assignments table to use school_name instead of school_id
    - Add missing columns and constraints
    - Fix RLS policies
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- First check if the table exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seat_assignments') THEN
    DROP TABLE seat_assignments CASCADE;
  END IF;
END $$;

-- Create seat_assignments table with correct schema
CREATE TABLE seat_assignments (
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

-- Enable RLS
ALTER TABLE seat_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users"
  ON seat_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_seat_assignments_updated_at
  BEFORE UPDATE ON seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();