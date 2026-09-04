import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.TURSO_DATABASE_URL || 'file:canteen.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

// Initialize Turso LibSQL client
export const db = createClient({
  url,
  authToken,
});

// Run schema on startup (idempotent - uses CREATE TABLE IF NOT EXISTS)
async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual SQL statements
      const statements = schema
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await db.execute(statement);
      }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          menu_item_id TEXT,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          price REAL NOT NULL DEFAULT 0
        )
      `);

      try {
        await db.execute('ALTER TABLE order_items ADD COLUMN price REAL NOT NULL DEFAULT 0');
      } catch (err) {
        if (!/duplicate column/i.test(err.message || '')) throw err;
      }
      console.log('Database schema synchronized successfully.');
    }
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
  }
}

initDb();

export default db;