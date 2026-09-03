import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

const router = express.Router();

function parseOrder(row) {
  if (!row) return null;
  return {
    ...row,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
  };
}

// POST /api/orders
router.post('/', async (req, res) => {
  const { id, client_id, client_name, client_phone, items, total_amount, payment_status, status } = req.body;
  
  // Guarantee an ID exists even if frontend omitted it
  const orderId = id || uuidv4();

  // Safely serialize items array/object to JSON string
  const serializedItems = typeof items === 'string' ? items : JSON.stringify(items || []);

  try {
    await db.execute({
      sql: `
        INSERT INTO orders (id, client_id, client_name, client_phone, items, total_amount, payment_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        orderId,
        client_id || null,
        client_name || null,
        client_phone || null,
        serializedItems,
        total_amount || 0,
        payment_status || 'pending',
        status || 'received',
      ],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId],
    });

    res.status(201).json(parseOrder(result.rows[0]));
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

export default router;