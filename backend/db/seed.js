// Run with: npm run seed
// Creates one admin staff account so you can log in and manage the menu/orders.
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './index.js';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@ggshcanteen.com';
const ADMIN_PIN = process.env.SEED_ADMIN_PIN || '123456';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin';

const existing = db.prepare('SELECT id FROM staff WHERE email = ?').get(ADMIN_EMAIL);
if (existing) {
  console.log(`Admin account already exists: ${ADMIN_EMAIL}`);
} else {
  const id = uuidv4();
  const pinHash = bcrypt.hashSync(ADMIN_PIN, 10);
  db.prepare(
    'INSERT INTO staff (id, email, pin_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, ADMIN_EMAIL, pinHash, ADMIN_NAME, 'admin');
  console.log(`Created admin account:\n  email: ${ADMIN_EMAIL}\n  pin: ${ADMIN_PIN}\n(change these via env vars SEED_ADMIN_EMAIL / SEED_ADMIN_PIN before seeding in production)`);
}
