-- First check if constraints exist and drop them if they do
DO $$ 
BEGIN
  -- Drop existing constraints if they exist
  IF EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'cities' AND constraint_name = 'latitude_range'
  ) THEN
    ALTER TABLE cities DROP CONSTRAINT latitude_range;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'cities' AND constraint_name = 'longitude_range'
  ) THEN
    ALTER TABLE cities DROP CONSTRAINT longitude_range;
  END IF;
END $$;

-- Add NOT NULL constraints if not already present
DO $$ 
BEGIN
  -- Check if columns are already NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'cities' 
    AND column_name = 'latitude' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE cities ALTER COLUMN latitude SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'cities' 
    AND column_name = 'longitude' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE cities ALTER COLUMN longitude SET NOT NULL;
  END IF;
END $$;

-- Add check constraints
ALTER TABLE cities
ADD CONSTRAINT latitude_range 
  CHECK (latitude BETWEEN -90 AND 90),
ADD CONSTRAINT longitude_range 
  CHECK (longitude BETWEEN -180 AND 180);

-- Update any remaining cities with default coordinates
UPDATE cities SET
  latitude = 52.0692,   -- Poland's center latitude
  longitude = 19.4803   -- Poland's center longitude
WHERE 
  latitude IS NULL OR 
  longitude IS NULL OR
  latitude = 0 OR 
  longitude = 0;