import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

const router = express.Router();

function parseOrder(row) {
  if (!row) return null;
  let items = [];
  if (row.items) {
    if (typeof row.items === 'string') {
      try {
        items = JSON.parse(row.items);
      } catch (e) {
        console.error(`Failed to parse items JSON for order ${row.id}:`, e);
        items = [];
      }
    } else {
      items = row.items;
    }
  }
  return {
    ...row,
    items,
  };
}

// POST /api/orders - Create Order
router.post('/', async (req, res) => {
  try {
    const { id, client_id, client_name, client_phone, items, total_amount, payment_status, status } = req.body;

    const orderId = id || uuidv4();
    const serializedItems = typeof items === 'string' ? items : JSON.stringify(items || []);
    const safeTotal = typeof total_amount === 'number' ? total_amount : parseFloat(total_amount) || 0;

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
        safeTotal,
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
    res.status(500).json({ error: 'Failed to create order', details: err.message || String(err) });
  }
});

// GET /api/orders - List Orders
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
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message || String(err) });
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
    res.status(500).json({ error: 'Failed to fetch order', details: err.message || String(err) });
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
    res.status(500).json({ error: 'Failed to update order', details: err.message || String(err) });
  }
});

// DELETE /api/orders - Clear Orders
router.delete('/', async (req, res) => {
  try {
    const result = await db.execute('DELETE FROM orders');
    res.json({ success: true, deleted: Number(result.rowsAffected) });
  } catch (err) {
    console.error('Error deleting all orders:', err);
    res.status(500).json({ error: 'Failed to clear orders', details: err.message || String(err) });
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
    res.status(500).json({ error: 'Failed to delete order', details: err.message || String(err) });
  }
});

export default router;