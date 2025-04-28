/*
  # Update performance types

  1. Changes
    - Drop age-related columns from performance_types table
    - Update existing types with new names
    - Remove age ranges from descriptions
*/

-- First drop age-related columns
ALTER TABLE performance_types
  DROP COLUMN IF EXISTS min_age,
  DROP COLUMN IF EXISTS max_age;

-- Remove existing types
TRUNCATE TABLE performance_types CASCADE;

-- Insert new types without age ranges
INSERT INTO performance_types (name, description)
VALUES 
  ('Dzieci Młodsze', 'Spektakle dedykowane dla młodszych dzieci'),
  ('Dzieci Starsze', 'Spektakle dedykowane dla starszych dzieci'),
  ('Młodzież', 'Spektakle dedykowane dla młodzieży'),
  ('Szkoły średnie', 'Spektakle dedykowane dla szkół średnich');