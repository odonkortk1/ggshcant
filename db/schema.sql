-- GGSH Canteen database schema
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('admin','user')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin','staff')), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, phone_number TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL, full_name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price REAL NOT NULL, category TEXT NOT NULL CHECK(category IN ('Breakfast','Lunch','Snacks','Beverages')), image_url TEXT, is_available INTEGER NOT NULL DEFAULT 1, is_special INTEGER NOT NULL DEFAULT 0, calories REAL, prep_time_minutes REAL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, items TEXT NOT NULL, total REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','preparing','ready','completed')), pickup_note TEXT, payment_method TEXT DEFAULT 'momo' CHECK(payment_method IN ('momo','cash','ggsh_ussd','stripe','paystack')), client_phone TEXT, payment_reference TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_phone ON orders(client_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
