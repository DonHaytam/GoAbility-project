const express = require('express');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    let query = "SELECT id, email, first_name, last_name, role, avatar_url, phone, city, country, is_active, subscription_tier, created_at FROM users WHERE 1=1";
    const params = [];

    if (role) { query += ' AND role = ?'; params.push(role); }
    if (search) { query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'; const s = `%${search.replace(/[%_]/g, '\\$&')}%`; params.push(s, s, s); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const [rows] = await sequelize.query(query, { replacements: params });
    res.json({ users: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get users' });
  }
});

router.get('/athletes', auth, authorize('coach', 'admin'), async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT id, email, first_name, last_name, avatar_url, city, bio FROM users WHERE role = 'athlete' AND is_active = true ORDER BY created_at DESC"
    );
    res.json({ athletes: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get athletes' });
  }
});

router.get('/coaches', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT id, email, first_name, last_name, avatar_url, city, bio FROM users WHERE role = 'coach' AND is_active = true ORDER BY first_name"
    );
    res.json({ coaches: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get coaches' });
  }
});

router.put('/:id/role', auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    await sequelize.query('UPDATE users SET role = ? WHERE id = ?', { replacements: [role, req.params.id] });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

router.put('/:id/toggle-status', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', { replacements: [req.params.id] });
    const [rows] = await sequelize.query('SELECT is_active FROM users WHERE id = ?', { replacements: [req.params.id] });
    res.json({ isActive: rows[0]?.is_active || false });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle status' });
  }
});

module.exports = router;
