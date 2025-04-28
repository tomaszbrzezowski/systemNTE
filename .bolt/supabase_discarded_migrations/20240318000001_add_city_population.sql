-- Add population column to cities table
ALTER TABLE cities ADD COLUMN population INTEGER;

-- Create index on population for better query performance
CREATE INDEX idx_cities_population ON cities(population);