-- Create hall_layouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS hall_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid REFERENCES halls(id) ON DELETE CASCADE,
  name text NOT NULL,
  rows integer DEFAULT 5,
  seats_per_row integer DEFAULT 10,
  numbering_style text DEFAULT 'arabic',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  layout_data jsonb,
  total_seats integer DEFAULT 0,
  UNIQUE(hall_id)
);

-- Enable RLS if not already enabled
ALTER TABLE hall_layouts ENABLE ROW LEVEL SECURITY;

-- Check if policy exists before trying to create it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hall_layouts' AND policyname = 'hall_layouts_auth_policy_v1'
  ) THEN
    -- Create RLS policy with a unique name
    CREATE POLICY "hall_layouts_auth_policy_v1"
      ON hall_layouts
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_hall_layouts_updated_at'
  ) THEN
    CREATE TRIGGER update_hall_layouts_updated_at
      BEFORE UPDATE ON hall_layouts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_hall_layouts_hall_id ON hall_layouts(hall_id);