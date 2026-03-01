-- Create device_tokens table for token-based device approval
-- Allows multiple devices on same IP to get approved individually

CREATE TABLE IF NOT EXISTS device_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  device_name VARCHAR(255),
  ip_address VARCHAR(45),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  pc_status VARCHAR(20) DEFAULT NULL,
  approved_by UUID REFERENCES staff_users(id) ON DELETE SET NULL,
  pc_id INTEGER REFERENCES pcs(id) ON DELETE SET NULL,
  approved_at TIMESTAMP NULL,
  last_used TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Manila'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Manila'),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Manila' + INTERVAL '30 days')
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_status ON device_tokens(status);
CREATE INDEX IF NOT EXISTS idx_device_tokens_ip_address ON device_tokens(ip_address);
CREATE INDEX IF NOT EXISTS idx_device_tokens_created_at ON device_tokens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_tokens_expires_at ON device_tokens(expires_at);

-- Add trigger for auto-update of updated_at
DROP TRIGGER IF EXISTS device_tokens_updated_at_trigger ON device_tokens;
CREATE TRIGGER device_tokens_updated_at_trigger
BEFORE UPDATE ON device_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to set PC status in device_tokens when token is approved
DROP TRIGGER IF EXISTS device_token_approved_set_status ON device_tokens;
CREATE TRIGGER device_token_approved_set_status
BEFORE UPDATE ON device_tokens
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
EXECUTE FUNCTION device_token_set_online_status();

-- Add trigger to update actual PC status when token is approved
DROP TRIGGER IF EXISTS device_token_approved_update_pc ON device_tokens;
CREATE TRIGGER device_token_approved_update_pc
AFTER UPDATE ON device_tokens
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.pc_id IS NOT NULL)
EXECUTE FUNCTION update_pc_status_on_token_approval();

-- Create function to set pc_status to online in device_tokens
DROP FUNCTION IF EXISTS device_token_set_online_status();
CREATE FUNCTION device_token_set_online_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.pc_status = 'online';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update actual PC status
DROP FUNCTION IF EXISTS update_pc_status_on_token_approval();
CREATE FUNCTION update_pc_status_on_token_approval()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pcs
  SET status = 'online', updated_at = NOW() AT TIME ZONE 'Asia/Manila'
  WHERE id = NEW.pc_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create admin_notifications table for notifying admin
CREATE TABLE IF NOT EXISTS admin_notifications (
  id SERIAL PRIMARY KEY,
  admin_id UUID REFERENCES staff_users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'device_token' CHECK (type IN ('device_token', 'new_ip', 'security_alert')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_type VARCHAR(50), -- e.g., 'device_token', 'ip_address', 'pc'
  reference_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Manila'),
  updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Manila')
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Add trigger for admin_notifications
DROP TRIGGER IF EXISTS admin_notifications_updated_at_trigger ON admin_notifications;
CREATE TRIGGER admin_notifications_updated_at_trigger
BEFORE UPDATE ON admin_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE device_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
