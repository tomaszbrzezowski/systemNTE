/*
  # Add default event settings

  1. Changes
    - Insert default settings record into event_settings table
    - This ensures there is always at least one settings record available
    
  Note: The event_settings table must exist before running this migration
*/

-- Insert default settings if none exist
INSERT INTO event_settings (
  require_show_title,
  auto_mark_completed
)
SELECT false, false
WHERE NOT EXISTS (
  SELECT 1 FROM event_settings
);