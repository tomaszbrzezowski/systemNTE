/*
  # Add event settings table
  
  1. New Tables
    - `event_settings`
      - `id` (uuid, primary key) 
      - `require_show_title` (boolean)
      - `auto_mark_completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS
    - Add policies for administrators
*/

CREATE TABLE IF NOT EXISTS event_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  require_show_title boolean DEFAULT false,
  auto_mark_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- Only administrators can manage event settings
CREATE POLICY "Event settings admin access"
  ON event_settings
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

-- Add trigger for updated_at
CREATE TRIGGER update_event_settings_updated_at
  BEFORE UPDATE ON event_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();