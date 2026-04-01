INSERT INTO admin (email, password_hash)
VALUES ('admin@proofly.app', crypt('password123', gen_salt('bf', 10)))
ON CONFLICT (email) DO NOTHING;
