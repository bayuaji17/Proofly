CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(255),
  country VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
