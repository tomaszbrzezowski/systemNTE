/*
  # Remove duplicate cities

  1. Changes
    - Creates a temporary table to store unique cities
    - Removes duplicate entries from cities table
    - Preserves city assignments and relationships
    - Maintains coordinates for cities
  
  2. Important Notes
    - Non-destructive operation that preserves user assignments
    - Keeps the first occurrence of each city name per voivodeship
    - Updates any foreign key references to point to the correct city ID
*/

-- Create temporary table for unique cities
CREATE TEMP TABLE unique_cities AS
WITH ranked_cities AS (
  SELECT 
    id,
    name,
    voivodeship,
    population,
    latitude,
    longitude,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY name, voivodeship 
      ORDER BY created_at ASC
    ) as rn
  FROM cities
)
SELECT 
  id,
  name,
  voivodeship,
  population,
  latitude,
  longitude,
  created_at
FROM ranked_cities 
WHERE rn = 1;

-- Update any foreign key references in calendar_events
UPDATE calendar_events ce
SET city_id = uc.id
FROM cities c1
JOIN unique_cities uc ON c1.name = uc.name AND c1.voivodeship = uc.voivodeship
WHERE ce.city_id = c1.id AND c1.id != uc.id;

-- Update assigned_city_ids arrays in users table
WITH user_cities AS (
  SELECT 
    u.id as user_id,
    array_agg(DISTINCT COALESCE(uc.id, ac)) as new_city_ids
  FROM users u
  CROSS JOIN unnest(u.assigned_city_ids) as ac
  LEFT JOIN cities c ON c.id = ac
  LEFT JOIN unique_cities uc ON c.name = uc.name AND c.voivodeship = uc.voivodeship
  GROUP BY u.id
)
UPDATE users u
SET assigned_city_ids = uc.new_city_ids
FROM user_cities uc
WHERE u.id = uc.user_id;

-- Delete duplicate cities
DELETE FROM cities c1
WHERE NOT EXISTS (
  SELECT 1 FROM unique_cities uc
  WHERE uc.id = c1.id
);

-- Drop temporary table
DROP TABLE unique_cities;