import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { requireStaff } from './middleware/auth.js';

const router = express.Router();

function rowToItem(row) {
  return {
    ...row,
    is_available: !!row.is_available,
    is_special: !!row.is_special,
  };
}

// GET /api/menu - public, anyone can read (matches original RLS: read: null)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM menu_items ORDER BY category, name').all();
  res.json(rows.map(rowToItem));
});

// POST /api/menu - admin/staff only
router.post('/', requireStaff, (req, res) => {
  const { name, description, price, category, image_url, is_available, is_special, calories, prep_time_minutes } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'name, price, and category are required' });
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO menu_items (id, name, description, price, category, image_url, is_available, is_special, calories, prep_time_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name, description || null, price, category, image_url || null,
    is_available === undefined ? 1 : is_available ? 1 : 0,
    is_special ? 1 : 0,
    calories || null, prep_time_minutes || null
  );
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  res.json(rowToItem(item));
});

// PUT /api/menu/:id - admin/staff only
router.put('/:id', requireStaff, (req, res) => {
  const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const fields = ['name', 'description', 'price', 'category', 'image_url', 'is_available', 'is_special', 'calories', 'prep_time_minutes'];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates[f] = (f === 'is_available' || f === 'is_special') ? (req.body[f] ? 1 : 0) : req.body[f];
    }
  }
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
  if (setClause) {
    db.prepare(`UPDATE menu_items SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`)
      .run({ ...updates, id: req.params.id });
  }
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  res.json(rowToItem(item));
});

// DELETE /api/menu/:id - admin/staff only
router.delete('/:id', requireStaff, (req, res) => {
  const result = db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ success: true });
});

export default router;
