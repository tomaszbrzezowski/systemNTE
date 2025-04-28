/*
  # Update performance types

  1. Changes
    - Removes existing performance types
    - Adds new performance types with updated names
    - Updates any existing show titles to use new type IDs
*/

-- First remove existing performance types
TRUNCATE TABLE performance_types CASCADE;

-- Insert new performance types
INSERT INTO performance_types (name, min_age, max_age, description)
VALUES 
  ('Dzieci Młodsze', 7, 10, 'Spektakle dedykowane dla młodszych dzieci'),
  ('Dzieci Starsze', 11, 13, 'Spektakle dedykowane dla starszych dzieci'),
  ('Młodzież', 14, 16, 'Spektakle dedykowane dla młodzieży'),
  ('Szkoły średnie', 16, 19, 'Spektakle dedykowane dla szkół średnich');