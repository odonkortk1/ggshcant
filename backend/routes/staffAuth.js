import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { requireStaff } from './middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_prod';

// POST /api/staff/login
router.post('/login', async (req, res) => {
  const { email, pin } = req.body;
  if (!email || !pin) return res.status(400).json({ error: 'Email and PIN are required' });

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM staff WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    const staff = result.rows[0];

    if (!staff || !(await bcrypt.compare(pin, staff.pin_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /api/staff/set-pin
router.post('/set-pin', async (req, res) => {
  const { email, pin } = req.body;
  if (!email || !pin) return res.status(400).json({ error: 'Email and PIN are required' });

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM staff WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    const staff = result.rows[0];
    if (!staff) return res.status(404).json({ error: 'Staff account not found' });

    const pinHash = await bcrypt.hash(pin, 10);
    await db.execute({
      sql: 'UPDATE staff SET pin_hash = ? WHERE id = ?',
      args: [pinHash, staff.id],
    });

    res.json({ success: true, message: 'PIN updated successfully' });
  } catch (err) {
    console.error('Set PIN error:', err);
    res.status(500).json({ error: 'Failed to set PIN' });
  }
});

// GET /api/staff (Admin only)
router.get('/', requireStaff, async (req, res) => {
  if (req.staff.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  try {
    const result = await db.execute('SELECT id, name, email, role, created_at FROM staff ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

// POST /api/staff (Admin only - create staff)
router.post('/', requireStaff, async (req, res) => {
  if (req.staff.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { name, email, role, pin } = req.body;

  if (!name || !email || !pin) {
    return res.status(400).json({ error: 'Name, email, and PIN are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM staff WHERE email = ?',
      args: [normalizedEmail],
    });
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Staff member with this email already exists' });
    }

    const id = uuidv4();
    const pinHash = await bcrypt.hash(pin, 10);

    await db.execute({
      sql: 'INSERT INTO staff (id, name, email, role, pin_hash) VALUES (?, ?, ?, ?, ?)',
      args: [id, name, normalizedEmail, role || 'staff', pinHash],
    });

    res.json({ id, name, email: normalizedEmail, role: role || 'staff' });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// PUT /api/staff/:id/pin (Admin only - reset staff PIN)
router.put('/:id/pin', requireStaff, async (req, res) => {
  if (req.staff.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'New PIN is required' });

  try {
    const staffResult = await db.execute({
      sql: 'SELECT id FROM staff WHERE id = ?',
      args: [req.params.id],
    });
    if (!staffResult.rows.length) return res.status(404).json({ error: 'Staff member not found' });

    const pinHash = await bcrypt.hash(pin, 10);
    await db.execute({
      sql: 'UPDATE staff SET pin_hash = ? WHERE id = ?',
      args: [pinHash, req.params.id],
    });

    res.json({ success: true, message: 'Staff PIN updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update PIN' });
  }
});

// DELETE /api/staff/:id (Admin only)
router.delete('/:id', requireStaff, async (req, res) => {
  if (req.staff.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  try {
    const result = await db.execute({
      sql: 'DELETE FROM staff WHERE id = ?',
      args: [req.params.id],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

export default router;