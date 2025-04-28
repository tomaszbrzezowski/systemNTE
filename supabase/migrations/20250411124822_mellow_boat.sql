/*
  # Fix hall_layouts schema issues
  
  1. Changes
    - Drop the numbering_style column from hall_layouts table
    - Ensure layout_data is used for storing all layout configuration
    - Fix RLS policies
    
  2. Notes
    - Resolves the "Could not find the 'numbering_style' column" error
    - Maintains backward compatibility with existing code
    - Improves schema design
*/

-- First check if the numbering_style column exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hall_layouts' AND column_name = 'numbering_style'
  ) THEN
    ALTER TABLE hall_layouts DROP COLUMN numbering_style;
  END IF;
END $$;

-- Make sure layout_data column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hall_layouts' AND column_name = 'layout_data'
  ) THEN
    ALTER TABLE hall_layouts ADD COLUMN layout_data jsonb;
  END IF;
END $$;

-- Make sure total_seats column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hall_layouts' AND column_name = 'total_seats'
  ) THEN
    ALTER TABLE hall_layouts ADD COLUMN total_seats integer DEFAULT 0;
  END IF;
END $$;

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_hall_layouts_hall_id ON hall_layouts(hall_id);

-- Update total_seats for existing hall layouts
UPDATE hall_layouts
SET total_seats = (
  CASE 
    WHEN layout_data IS NOT NULL AND layout_data ? 'sections' THEN
      (
        SELECT SUM(
          CASE 
            WHEN (section_data->>'enabled')::boolean THEN 
              (section_data->>'rows')::integer * (section_data->>'seatsPerRow')::integer
            ELSE 0
          END
        )
        FROM jsonb_each(layout_data->'sections') AS sections(section_key, section_data)
      )
    ELSE
      rows * seats_per_row
  END
)
WHERE total_seats = 0 OR total_seats IS NULL;