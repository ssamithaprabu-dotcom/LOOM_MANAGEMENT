import express from 'express';
import { all, get, run } from '../db.js';

const router = express.Router();

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const rows = await all(`SELECT id, type, text, time, \`read\` FROM notifications ORDER BY created_at DESC`);
    const formatted = rows.map((r) => ({
      id: r.id,
      type: r.type,
      text: r.text,
      time: r.time,
      read: Boolean(r.read),
    }));
    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications
router.post('/', async (req, res) => {
  try {
    const { id, type, text, time } = req.body;
    const notifId = id || `n-${Date.now()}`;
    const notifTime = time || 'Just now';
    const notifType = type || 'INFO';

    await run(
      `INSERT INTO notifications (id, type, text, time, \`read\`) VALUES (?, ?, ?, ?, 0)`,
      [notifId, notifType, text, notifTime]
    );

    const created = await get(`SELECT id, type, text, time, \`read\` FROM notifications WHERE id = ?`, [notifId]);
    return res.status(201).json({
      id: created.id,
      type: created.type,
      text: created.text,
      time: created.time,
      read: Boolean(created.read),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    await run(`UPDATE notifications SET \`read\` = 1`);
    const rows = await all(`SELECT id, type, text, time, \`read\` FROM notifications ORDER BY created_at DESC`);
    return res.json(rows.map((r) => ({ ...r, read: Boolean(r.read) })));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    await run(`UPDATE notifications SET \`read\` = 1 WHERE id = ?`, [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
