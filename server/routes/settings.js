import express from 'express';
import bcrypt from 'bcryptjs';
import { get, run } from '../db.js';

const router = express.Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const settings = await get(`SELECT username, email FROM settings ORDER BY id ASC LIMIT 1`);
    return res.json(settings || { username: 'admin', email: 'admin@example.com' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings / change password
router.put('/', async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const targetIdentifier = username || 'admin';
    const user = await get(`SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1`, [targetIdentifier, targetIdentifier]);
    if (currentPassword && newPassword) {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, user.id]);
    }

    if (username || email) {
      const currentSetting = await get(`SELECT id FROM settings ORDER BY id ASC LIMIT 1`);
      if (currentSetting) {
        await run(`UPDATE settings SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?`, [username, email, currentSetting.id]);
      } else {
        await run(`INSERT INTO settings (username, email) VALUES (?, ?)`, [username || 'admin', email || 'admin@example.com']);
      }
      if (user) {
        await run(`UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?`, [username, email, user.id]);
      }
    }

    const updated = await get(`SELECT username, email FROM settings ORDER BY id ASC LIMIT 1`);
    return res.json({ message: 'Settings updated successfully', settings: updated });
  } catch (error) {
    console.error('Settings update error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

// PUT /api/profile - Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { username, email } = req.body;

    const currentSetting = await get(`SELECT id FROM settings ORDER BY id ASC LIMIT 1`);
    if (currentSetting) {
      await run(`UPDATE settings SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE id = ?`, [username, email, currentSetting.id]);
    } else {
      await run(`INSERT INTO settings (username, email) VALUES (?, ?)`, [username || 'admin', email || 'admin@example.com']);
    }
    await run(`UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email) WHERE role = 'Administrator'`, [username, email]);

    const updated = await get(`SELECT username, email FROM settings ORDER BY id ASC LIMIT 1`);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
