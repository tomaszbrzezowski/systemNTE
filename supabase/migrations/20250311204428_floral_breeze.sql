/*
  # Remove temporary data
  
  1. Changes
    - Remove all temporary data from tables
    - Preserve table structures and relationships
    - Keep RLS policies and triggers intact
    
  2. Tables Affected
    - halls
    - agreements
    - agreement_performances
    - show_titles
    - calendar_show_titles
    - clients
*/

-- Remove data from agreements and related tables
TRUNCATE TABLE agreement_performances CASCADE;
TRUNCATE TABLE agreements CASCADE;

-- Remove data from halls
TRUNCATE TABLE halls CASCADE;

-- Remove data from clients
TRUNCATE TABLE clients CASCADE;

-- Remove data from show titles and related tables
TRUNCATE TABLE calendar_show_titles CASCADE;
TRUNCATE TABLE show_titles CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS agreements_agreement_number_seq RESTART;