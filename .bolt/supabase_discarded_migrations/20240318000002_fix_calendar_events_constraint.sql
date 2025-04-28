-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_calendar_events_calendar_id;
DROP INDEX IF EXISTS idx_calendar_events_date;

-- Add unique constraint for calendar_id and date combination
ALTER TABLE calendar_events 
ADD CONSTRAINT calendar_events_calendar_id_date_key 
UNIQUE (calendar_id, date);

-- Recreate optimized indexes
CREATE INDEX idx_calendar_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX idx_calendar_events_date ON calendar_events(date);