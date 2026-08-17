import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { signStaffToken } from './middleware/auth.js';

const router = express.Router();

function validatePin(pin) {
  return /^\d{6}$/.test(pin);
}

// POST /api/staff-auth/login
router.post('/login', async (req, res) => {
  const { email, pin } = req.body;
  if (!email || !pin) {
    return res.status(400).json({ error: 'Email and PIN are required' });
  }
  if (!validatePin(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 6 digits' });
  }

  const staff = db.prepare('SELECT * FROM staff WHERE email = ?').get(email.toLowerCase().trim());
  if (!staff || !(await bcrypt.compare(pin, staff.pin_hash))) {
    return res.status(401).json({ error: 'Invalid email or PIN' });
  }

  const token = signStaffToken(staff);
  res.json({
    token,
    staff_id: staff.id,
    email: staff.email,
    full_name: staff.full_name,
    role: staff.role || 'staff',
  });
});

// POST /api/staff-auth/change-pin
router.post('/change-pin', async (req, res) => {
  const { email, old_pin, new_pin } = req.body;
  if (!email || !old_pin || !new_pin) {
    return res.status(400).json({ error: 'Email, current PIN, and new PIN are required' });
  }
  if (!validatePin(new_pin)) {
    return res.status(400).json({ error: 'New PIN must be exactly 6 digits' });
  }
  if (old_pin === new_pin) {
    return res.status(400).json({ error: 'New PIN must be different from current PIN' });
  }

  const staff = db.prepare('SELECT * FROM staff WHERE email = ?').get(email.toLowerCase().trim());
  if (!staff || !(await bcrypt.compare(old_pin, staff.pin_hash))) {
    return res.status(401).json({ error: 'Current PIN is incorrect' });
  }

  const pinHash = await bcrypt.hash(new_pin, 10);
  db.prepare('UPDATE staff SET pin_hash = ? WHERE id = ?').run(pinHash, staff.id);
  res.json({ success: true, message: 'PIN changed successfully' });
});

export default router;
