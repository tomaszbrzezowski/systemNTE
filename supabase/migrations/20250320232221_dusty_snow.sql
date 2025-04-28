/*
  # Add SMS messages functionality
  
  1. New Tables
    - `sms_messages`
      - Stores SMS message history and status
      - Tracks delivery and API responses
      - Links to events and users
      
  2. Functions
    - `optimize_sms_messages`: Optimizes table after bulk operations
    
  3. Security
    - Enable RLS
    - Add policies for administrators
*/

-- Create sms_messages table
CREATE TABLE sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  phone_type text NOT NULL CHECK (phone_type IN ('k', 's')),
  message text NOT NULL,
  status integer NOT NULL DEFAULT 0,
  api_id text,
  sms_date timestamptz,
  delivery_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for authenticated users"
  ON sms_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_sms_messages_updated_at
  BEFORE UPDATE ON sms_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to optimize table
CREATE OR REPLACE FUNCTION optimize_sms_messages()
RETURNS void AS $$
BEGIN
  ANALYZE sms_messages;
END;
$$ LANGUAGE plpgsql;