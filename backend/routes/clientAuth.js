import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'client-secret-key-change-in-prod';

// Client Register
router.post('/register', async (req, res) => {
  const { phone_number, full_name, pin } = req.body;
  if (!phone_number || !full_name || !pin) {
    return res.status(400).json({ error: 'phone_number, full_name, and pin are required' });
  }

  try {
    const existingResult = await db.execute({
      sql: 'SELECT id FROM clients WHERE phone_number = ?',
      args: [phone_number],
    });

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const id = uuidv4();
    const pinHash = await bcrypt.hash(pin, 10);

    await db.execute({
      sql: 'INSERT INTO clients (id, phone_number, full_name, pin_hash) VALUES (?, ?, ?, ?)',
      args: [id, phone_number, full_name, pinHash],
    });

    const clientResult = await db.execute({
      sql: 'SELECT id, phone_number, full_name, created_at FROM clients WHERE id = ?',
      args: [id],
    });

    const client = clientResult.rows[0];
    const token = jwt.sign({ id: client.id, phone_number: client.phone_number }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, client });
  } catch (err) {
    console.error('Client registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Client Login
router.post('/login', async (req, res) => {
  const { phone_number, pin } = req.body;
  if (!phone_number || !pin) {
    return res.status(400).json({ error: 'phone_number and pin are required' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE phone_number = ?',
      args: [phone_number],
    });

    const client = result.rows[0];
    if (!client) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    const match = await bcrypt.compare(pin, client.pin_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid phone number or PIN' });
    }

    const token = jwt.sign({ id: client.id, phone_number: client.phone_number }, JWT_SECRET, { expiresIn: '7d' });
    const { pin_hash, ...safeClient } = client;

    res.json({ token, client: safeClient });
  } catch (err) {
    console.error('Client login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Client Reset PIN
router.post('/reset-pin', async (req, res) => {
  const { phone_number, new_pin } = req.body;
  if (!phone_number || !new_pin) {
    return res.status(400).json({ error: 'phone_number and new_pin are required' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM clients WHERE phone_number = ?',
      args: [phone_number],
    });

    const client = result.rows[0];
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const pinHash = await bcrypt.hash(new_pin, 10);
    await db.execute({
      sql: 'UPDATE clients SET pin_hash = ? WHERE id = ?',
      args: [pinHash, client.id],
    });

    res.json({ message: 'PIN reset successfully' });
  } catch (err) {
    console.error('PIN reset error:', err);
    res.status(500).json({ error: 'PIN reset failed' });
  }
});

export default router;