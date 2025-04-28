/*
  # Empty performances data
  
  1. Changes
    - Removes all data from agreement_performances table
    - Maintains table structure and constraints
    - Safe operation that only affects data, not schema
    
  2. Notes
    - Uses TRUNCATE for efficient removal
    - Cascading delete to handle foreign key relationships
*/

-- Empty agreement_performances table
TRUNCATE TABLE agreement_performances CASCADE;