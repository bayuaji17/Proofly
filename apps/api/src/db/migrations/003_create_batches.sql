CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 100000),
  production_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (product_id, batch_number)
);
