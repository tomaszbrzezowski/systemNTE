-- Add order column to calendars table with default value
ALTER TABLE calendars ADD COLUMN "order" INTEGER DEFAULT 0;

-- Create index on order column for better sorting performance
CREATE INDEX idx_calendars_order ON calendars("order");

-- Update existing calendars to have sequential order based on creation date
WITH ordered_calendars AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM calendars
)
UPDATE calendars
SET "order" = ordered_calendars.row_num
FROM ordered_calendars
WHERE calendars.id = ordered_calendars.id;