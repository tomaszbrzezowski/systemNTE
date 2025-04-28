/*
  # Add performance types without age ranges
  
  1. Changes
    - Empty existing performance types table
    - Insert new performance types without age ranges
    
  2. Types Added
    - Dzieci Młodsze
    - Dzieci Starsze
    - Młodzież
    - Szkoły średnie
*/

-- Empty existing performance types
TRUNCATE TABLE performance_types CASCADE;

-- Insert new types without age ranges
INSERT INTO performance_types (name, description)
VALUES 
  ('Dzieci Młodsze', 'Spektakle dedykowane dla młodszych dzieci'),
  ('Dzieci Starsze', 'Spektakle dedykowane dla starszych dzieci'),
  ('Młodzież', 'Spektakle dedykowane dla młodzieży'),
  ('Szkoły średnie', 'Spektakle dedykowane dla szkół średnich');