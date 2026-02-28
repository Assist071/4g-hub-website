-- Create detected_ips table for tracking IP addresses detected by clients
-- but not yet registered to any PC

CREATE TABLE IF NOT EXISTS detected_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'registered', 'ignored')),
  assigned_pc_id INTEGER NULL REFERENCES pcs(id) ON DELETE SET NULL,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_detected_ips_ip_address ON detected_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_detected_ips_status ON detected_ips(status);
CREATE INDEX IF NOT EXISTS idx_detected_ips_detected_at ON detected_ips(detected_at DESC);

-- Add trigger for auto-update of updated_at
DROP TRIGGER IF EXISTS detected_ips_updated_at_trigger ON detected_ips;
CREATE TRIGGER detected_ips_updated_at_trigger
BEFORE UPDATE ON detected_ips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE detected_ips;
