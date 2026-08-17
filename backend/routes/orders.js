import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { requireStaff } from './middleware/auth.js';

const router = express.Router();

function rowToOrder(row) {
  return { ...row, items: JSON.parse(row.items) };
}

// POST /api/orders - public (matches original RLS: create: null)
// Creates a pending cash/USSD order directly (no payment gateway round-trip).
router.post('/', (req, res) => {
  const { customer_name, items, pickup_note, payment_method, client_phone } = req.body;
  if (!customer_name || !items?.length) {
    return res.status(400).json({ error: 'customer_name and items are required' });
  }
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  if (total <= 0) return res.status(400).json({ error: 'Total must be greater than zero' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO orders (id, customer_name, items, total, status, pickup_note, payment_method, client_phone)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(id, customer_name, JSON.stringify(items), total, pickup_note || '', payment_method || 'cash', client_phone || '');

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json(rowToOrder(order));
});

// GET /api/orders/:id - fetch a single order (used after payment redirects)
router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(rowToOrder(order));
});

// GET /api/orders?client_phone=... - client's own orders
// GET /api/orders (staff, authenticated) - all orders
router.get('/', (req, res) => {
  const { client_phone, active_only } = req.query;

  if (client_phone) {
    const rows = db.prepare(
      'SELECT * FROM orders WHERE client_phone = ? ORDER BY created_at DESC LIMIT 100'
    ).all(client_phone);
    return res.json(rows.map(rowToOrder));
  }

  // Staff view requires auth
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'client_phone or staff auth required' });

  return requireStaff(req, res, () => {
    const query = active_only === 'true'
      ? "SELECT * FROM orders WHERE status != 'completed' ORDER BY created_at DESC LIMIT 100"
      : 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 500';
    const rows = db.prepare(query).all();
    res.json(rows.map(rowToOrder));
  });
});

// PATCH /api/orders/:id/status - staff only, advances kanban status
router.patch('/:id/status', requireStaff, (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'preparing', 'ready', 'completed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
  }
  const result = db.prepare(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(rowToOrder(order));
});

// DELETE /api/orders/:id - admin only (matches original RLS: delete requires admin)
router.delete('/:id', requireStaff, (req, res) => {
  if (req.staff.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true });
});

export default router;
