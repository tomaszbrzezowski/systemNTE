/*
  # Empty all performances data
  
  1. Changes
    - Removes all data from agreement_performances table
    - Removes all data from agreements table
    - Removes all data from show_titles table
    - Removes all data from calendar_show_titles table
    
  2. Notes
    - Uses TRUNCATE for efficient removal
    - Cascading delete to handle foreign key relationships
*/

-- Empty all performance-related tables
TRUNCATE TABLE agreement_performances CASCADE;
TRUNCATE TABLE agreements CASCADE;
TRUNCATE TABLE show_titles CASCADE;
TRUNCATE TABLE calendar_show_titles CASCADE;