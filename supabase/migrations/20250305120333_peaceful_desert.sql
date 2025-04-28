/*
  # Create event settings table
  
  1. New Tables
    - `event_settings`
      - `id` (uuid, primary key)
      - `require_show_title` (boolean)
      - `auto_mark_completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `event_settings` table
    - Add policies for administrators to manage settings
    - Add policies for authenticated users to view settings

  Note: The update_updated_at_column trigger already exists in the database
*/

CREATE TABLE IF NOT EXISTS event_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  require_show_title boolean DEFAULT false,
  auto_mark_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- Allow administrators to manage settings
CREATE POLICY "Administrators can manage event settings"
  ON event_settings
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

-- Allow all authenticated users to view settings
CREATE POLICY "Authenticated users can view event settings"
  ON event_settings
  FOR SELECT
  TO authenticated
  USING (true);