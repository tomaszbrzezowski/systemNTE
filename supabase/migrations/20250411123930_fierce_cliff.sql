/*
  # Fix hall layout seat counting
  
  1. Changes
    - Add total_seats column to hall_layouts table if it doesn't exist
    - Update existing hall_layouts to calculate total seats correctly
    - Add index for better query performance
    
  2. Notes
    - Ensures proper storage of seat counts
    - Maintains backward compatibility with existing code
    - Improves query performance for layout data
*/

-- Add total_seats column to hall_layouts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hall_layouts' AND column_name = 'total_seats'
  ) THEN
    ALTER TABLE hall_layouts
    ADD COLUMN total_seats integer DEFAULT 0;
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