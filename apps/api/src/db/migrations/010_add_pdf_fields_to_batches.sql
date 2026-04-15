ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_status VARCHAR(20) DEFAULT 'idle';

-- Possible values for pdf_status: 'idle', 'processing', 'completed', 'failed'
