import express from 'express';
import { db } from '../db/index.js';

const router = express.Router();

// Helper to safely parse order items stored as JSON
function parseOrder(row) {
  if (!row) return null;
  return {
    ...row,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
  };
}

// POST /api/orders - Create Order
router.post('/', async (req, res) => {
  const { id, client_id, client_name, client_phone, items, total_amount, payment_status, status } = req.body;
  try {
    await db.execute({
      sql: `
        INSERT INTO orders (id, client_id, client_name, client_phone, items, total_amount, payment_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        client_id || null,
        client_name || null,
        client_phone || null,
        JSON.stringify(items),
        total_amount,
        payment_status || 'pending',
        status || 'received',
      ],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [id],
    });

    res.status(201).json(parseOrder(result.rows[0]));
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id - Get Order by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [req.params.id],
    });

    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json(parseOrder(order));
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/orders - List Orders (Supports ?client_id= query filter)
router.get('/', async (req, res) => {
  const { client_id } = req.query;
  try {
    let result;
    if (client_id) {
      result = await db.execute({
        sql: 'SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC',
        args: [client_id],
      });
    } else {
      result = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
    }

    res.json(result.rows.map(parseOrder));
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/:id/status - Update Order Status
router.put('/:id/status', async (req, res) => {
  const { status, payment_status } = req.body;
  try {
    if (status && payment_status) {
      await db.execute({
        sql: 'UPDATE orders SET status = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [status, payment_status, req.params.id],
      });
    } else if (status) {
      await db.execute({
        sql: 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [status, req.params.id],
      });
    } else if (payment_status) {
      await db.execute({
        sql: 'UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [payment_status, req.params.id],
      });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [req.params.id],
    });

    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json(parseOrder(order));
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/orders - Bulk Delete Orders
router.delete('/', async (req, res) => {
  try {
    const result = await db.execute('DELETE FROM orders');
    res.json({ success: true, deleted: Number(result.rowsAffected) });
  } catch (err) {
    console.error('Error deleting all orders:', err);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

// DELETE /api/orders/:id - Delete Single Order
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM orders WHERE id = ?',
      args: [req.params.id],
    });

    if (Number(result.rowsAffected) === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;