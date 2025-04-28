/*
  # Add position columns to layout_sections table
  
  1. Changes
    - Add x, y, width, height, and rotation columns to layout_sections table
    - These columns are needed for the hall layout editor to function properly
    
  2. Notes
    - Safe to run on existing data
    - Adds default values for backward compatibility
*/

-- Add position columns to layout_sections table if they don't exist
DO $$ 
BEGIN
  -- Add x column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_sections' AND column_name = 'x'
  ) THEN
    ALTER TABLE layout_sections ADD COLUMN x integer DEFAULT 0;
  END IF;

  -- Add y column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_sections' AND column_name = 'y'
  ) THEN
    ALTER TABLE layout_sections ADD COLUMN y integer DEFAULT 0;
  END IF;

  -- Add width column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_sections' AND column_name = 'width'
  ) THEN
    ALTER TABLE layout_sections ADD COLUMN width integer DEFAULT 30;
  END IF;

  -- Add height column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_sections' AND column_name = 'height'
  ) THEN
    ALTER TABLE layout_sections ADD COLUMN height integer DEFAULT 20;
  END IF;

  -- Add rotation column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_sections' AND column_name = 'rotation'
  ) THEN
    ALTER TABLE layout_sections ADD COLUMN rotation integer DEFAULT 0;
  END IF;
END $$;