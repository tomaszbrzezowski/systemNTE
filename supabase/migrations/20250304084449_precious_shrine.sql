/*
  # Add city coordinates

  1. Changes
    - Add latitude and longitude columns to cities table
    - Set default coordinates to Poland's center (52.0692, 19.4803)
    - Make columns NOT NULL with default values
    
  2. Notes
    - Uses NUMERIC(10,6) for high precision coordinate storage
    - Default coordinates point to approximate center of Poland
*/

-- Add coordinate columns with defaults
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6) NOT NULL DEFAULT 52.0692,
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6) NOT NULL DEFAULT 19.4803;

-- Add check constraints to ensure valid coordinate ranges
ALTER TABLE cities
ADD CONSTRAINT latitude_range 
  CHECK (latitude BETWEEN -90 AND 90),
ADD CONSTRAINT longitude_range 
  CHECK (longitude BETWEEN -180 AND 180);