import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { requireStaff } from './middleware/auth.js';

const router = express.Router();

function rowToItem(row) {
  if (!row) return null;
  return {
    ...row,
    is_available: !!row.is_available,
    is_special: !!row.is_special,
  };
}

// GET /api/menu - public, anyone can read
router.get('/', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM menu_items ORDER BY category, name');
    res.json(result.rows.map(rowToItem));
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST /api/menu - admin/staff only
router.post('/', requireStaff, async (req, res) => {
  const { name, description, price, category, image_url, is_available, is_special, calories, prep_time_minutes } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'name, price, and category are required' });
  }

  const id = uuidv4();
  try {
    await db.execute({
      sql: `
        INSERT INTO menu_items (id, name, description, price, category, image_url, is_available, is_special, calories, prep_time_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        name,
        description || null,
        price,
        category,
        image_url || null,
        is_available === undefined ? 1 : is_available ? 1 : 0,
        is_special ? 1 : 0,
        calories || null,
        prep_time_minutes || null,
      ],
    });

    const result = await db.execute({
      sql: 'SELECT * FROM menu_items WHERE id = ?',
      args: [id],
    });

    res.json(rowToItem(result.rows[0]));
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT /api/menu/:id - admin/staff only
router.put('/:id', requireStaff, async (req, res) => {
  try {
    const existingResult = await db.execute({
      sql: 'SELECT * FROM menu_items WHERE id = ?',
      args: [req.params.id],
    });

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const fields = ['name', 'description', 'price', 'category', 'image_url', 'is_available', 'is_special', 'calories', 'prep_time_minutes'];
    const updates = [];
    const args = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        args.push((f === 'is_available' || f === 'is_special') ? (req.body[f] ? 1 : 0) : req.body[f]);
      }
    }

    if (updates.length > 0) {
      args.push(req.params.id);
      await db.execute({
        sql: `UPDATE menu_items SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args,
      });
    }

    const updatedResult = await db.execute({
      sql: 'SELECT * FROM menu_items WHERE id = ?',
      args: [req.params.id],
    });

    res.json(rowToItem(updatedResult.rows[0]));
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/menu/:id - admin/staff only
router.delete('/:id', requireStaff, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM menu_items WHERE id = ?',
      args: [req.params.id],
    });

    if (Number(result.rowsAffected) === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;