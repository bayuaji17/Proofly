-- Update quantity constraint from 100000 to 10000
ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_quantity_check;
ALTER TABLE batches ADD CONSTRAINT batches_quantity_check CHECK (quantity > 0 AND quantity <= 10000);
