import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { signStaffToken, requireAdmin } from './middleware/auth.js';

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

// GET /api/staff-auth/staff
router.get('/staff', requireAdmin, (req, res) => {
  const staff = db.prepare(
    'SELECT id, email, full_name, role, created_at FROM staff ORDER BY created_at DESC'
  ).all();
  res.json(staff);
});

// POST /api/staff-auth/staff
router.post('/staff', requireAdmin, async (req, res) => {
  const { full_name, email, pin, role } = req.body;
  if (!full_name?.trim() || !email?.trim() || !validatePin(pin)) {
    return res.status(400).json({ error: 'full_name, email, and a valid 6-digit pin are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM staff WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'This email is already in use' });
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const staff = {
    id: uuidv4(),
    email: normalizedEmail,
    full_name: full_name.trim(),
    role: role === 'admin' ? 'admin' : 'staff',
  };
  db.prepare(
    'INSERT INTO staff (id, email, pin_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
  ).run(staff.id, staff.email, pinHash, staff.full_name, staff.role);

  res.status(201).json(staff);
});

// PATCH /api/staff-auth/staff/:id/reset-pin
router.patch('/staff/:id/reset-pin', requireAdmin, async (req, res) => {
  const { pin } = req.body;
  if (!validatePin(pin)) {
    return res.status(400).json({ error: 'A valid 6-digit pin is required' });
  }

  const staff = db.prepare('SELECT id FROM staff WHERE id = ?').get(req.params.id);
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  const pinHash = await bcrypt.hash(pin, 10);
  db.prepare('UPDATE staff SET pin_hash = ? WHERE id = ?').run(pinHash, req.params.id);
  res.json({ success: true, message: 'PIN reset successfully' });
});

// DELETE /api/staff-auth/staff/:id
router.delete('/staff/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Staff member not found' });
  }
  res.json({ success: true, message: 'Staff account removed' });
});

export default router;
