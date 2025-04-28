/*
  # Reorganize cities table with coordinates

  1. Changes
    - Create new cities table with correct column order
    - Preserve foreign key relationships
    - Add coordinate constraints
*/

-- First rename the existing table
ALTER TABLE cities RENAME TO cities_old;

-- Create new table with desired structure
CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  voivodeship text NOT NULL,
  population integer,
  created_at timestamptz DEFAULT now(),
  latitude numeric(10,6) NOT NULL DEFAULT 52.0692,
  longitude numeric(10,6) NOT NULL DEFAULT 19.4803
);

-- Copy data from old table to new table
INSERT INTO cities (
  id,
  name,
  voivodeship,
  population,
  created_at,
  latitude,
  longitude
)
SELECT
  id,
  name,
  voivodeship,
  population,
  created_at,
  latitude,
  longitude
FROM cities_old;

-- Update foreign key in calendar_events to point to new table
ALTER TABLE calendar_events
  DROP CONSTRAINT calendar_events_city_id_fkey,
  ADD CONSTRAINT calendar_events_city_id_fkey 
    FOREIGN KEY (city_id) 
    REFERENCES cities(id);

-- Drop old table
DROP TABLE cities_old;

-- Add coordinate constraints
ALTER TABLE cities
ADD CONSTRAINT latitude_range 
  CHECK (latitude BETWEEN -90 AND 90),
ADD CONSTRAINT longitude_range 
  CHECK (longitude BETWEEN -180 AND 180);