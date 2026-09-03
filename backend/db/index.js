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
      console.log('Database schema synchronized successfully.');
    }
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
  }
}

initDb();

export default db;