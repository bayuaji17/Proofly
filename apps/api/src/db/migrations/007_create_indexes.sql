CREATE INDEX IF NOT EXISTS idx_products_admin_id ON products(admin_id);
CREATE INDEX IF NOT EXISTS idx_batches_product_id ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch_id ON qr_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_qr_code_id ON scan_logs(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_notifications_admin_id ON notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
