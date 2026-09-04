import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

const router = express.Router();

// Helper: Attach order_items and map all status / name aliases expected by dashboard
async function attachItemsToOrder(order) {
  if (!order) return null;
  
  let items = [];
  try {
    const itemsResult = await db.execute({
      sql: 'SELECT * FROM order_items WHERE order_id = ?',
      args: [order.id],
    });
    items = itemsResult.rows || [];
  } catch (err) {
    console.error(`Could not fetch order_items for order ${order.id}:`, err.message);
  }

  // Normalize status string so pending/received map to 'new' for the active dashboard
  const currentStatus = order.status ? order.status.toLowerCase() : 'new';
  const mappedStatus = ['pending', 'received', 'new'].includes(currentStatus) ? 'new' : currentStatus;

  return {
    ...order,
    // Provide aliases for both client_* and customer_* fields
    client_name: order.customer_name || order.client_name || 'Guest',
    customer_name: order.customer_name || order.client_name || 'Guest',
    client_phone: order.customer_phone || order.client_phone || '',
    customer_phone: order.customer_phone || order.client_phone || '',
    
    // Map status so 'pending' or 'received' satisfies 'new' filters
    status: mappedStatus,
    raw_status: currentStatus,
    payment_status: order.payment_status || 'pending',
    
    items: items.map(item => ({
      ...item,
      name: item.item_name || item.name || 'Menu Item',
      title: item.item_name || item.title || 'Menu Item',
      price: item.price || 0,
    })),
    
    created_at: order.created_at || new Date().toISOString(),
  };
}

// POST /api/orders - Create Order
router.post('/', async (req, res) => {
  try {
    const { id, client_name, client_phone, customer_name, customer_phone, items, total_amount, status } = req.body;

    const orderId = id || uuidv4();
    const safeTotal = typeof total_amount === 'number' ? total_amount : parseFloat(total_amount) || 0;
    const name = customer_name || client_name || 'Guest';
    const phone = customer_phone || client_phone || '';
    const itemList = Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items) : []);

    await db.execute({
      sql: `
        INSERT INTO orders (id, customer_name, customer_phone, total_amount, status)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        orderId,
        name,
        phone,
        safeTotal,
        status || 'received',
      ],
    });

    for (const item of itemList) {
      const orderItemId = uuidv4();
      const itemName = item.name || item.item_name || item.title || 'Menu Item';
      const menuItemId = item.id || item.menu_item_id || item.item_id || uuidv4();
      const qty = item.quantity || item.qty || 1;

      try {
        await db.execute({
          sql: `
            INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity)
            VALUES (?, ?, ?, ?, ?)
          `,
          args: [
            orderItemId,
            orderId,
            menuItemId,
            itemName,
            qty,
          ],
        });
      } catch (itemErr) {
        console.error('Failed to insert order_item:', itemErr.message);
      }
    }

    const orderResult = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId],
    });

    const fullOrder = await attachItemsToOrder(orderResult.rows[0]);
    res.status(201).json(fullOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message || String(err) });
  }
});

// GET /api/orders - List Orders
router.get('/', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM orders');
    const ordersWithItems = await Promise.all((result.rows || []).map(attachItemsToOrder));
    res.json(ordersWithItems);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message || String(err) });
  }
});

// GET /api/orders/:id - Get Single Order
router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [req.params.id],
    });

    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const fullOrder = await attachItemsToOrder(order);
    res.json(fullOrder);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order', details: err.message || String(err) });
  }
});

// PUT /api/orders/:id/status - Update Order Status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    if (status) {
      await db.execute({
        sql: 'UPDATE orders SET status = ? WHERE id = ?',
        args: [status, req.params.id],
      });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [req.params.id],
    });

    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const fullOrder = await attachItemsToOrder(order);
    res.json(fullOrder);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order', details: err.message || String(err) });
  }
});

// DELETE /api/orders - Clear All Orders
router.delete('/', async (req, res) => {
  try {
    try {
      await db.execute('DELETE FROM order_items');
    } catch (e) {
      console.error('Error clearing order_items:', e.message);
    }
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
    try {
      await db.execute({
        sql: 'DELETE FROM order_items WHERE order_id = ?',
        args: [req.params.id],
      });
    } catch (e) {
      console.error('Error deleting order_items:', e.message);
    }

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