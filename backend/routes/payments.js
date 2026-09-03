import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// ... existing code / routes above ...

// Update order status on payment resolution/webhook
// Lines ~152 & ~221 updated to await db.execute()
router.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === 'charge.success') {
      const resolvedOrderId = data.reference || data.metadata?.order_id;
      if (resolvedOrderId) {
        await db.execute({
          sql: "UPDATE orders SET status = 'preparing' WHERE id = ?",
          args: [resolvedOrderId],
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Payment webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Callback / Verify Handler
router.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  try {
    const orderId = reference; // or extracted from transaction lookup
    if (orderId) {
      await db.execute({
        sql: "UPDATE orders SET status = 'preparing' WHERE id = ?",
        args: [orderId],
      });
    }
    res.json({ success: true, orderId });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;