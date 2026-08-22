// Uses Node's built-in SQLite module (node:sqlite, stable since Node 22.5+).
// No native compilation needed - avoids the better-sqlite3/node-gyp/Visual
// Studio build-tools requirement on Windows.
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'canteen.db');

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Run schema on startup (idempotent - uses CREATE TABLE IF NOT EXISTS)
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

export default db;