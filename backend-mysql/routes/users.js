const express = require('express');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (currentPage - 1) * pageLimit;

    const whereClauses = [];
    const params = [];
    if (role) { whereClauses.push('role = ?'); params.push(role); }
    if (search) { whereClauses.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)'); const s = `%${search.replace(/[%_]/g, '\\$&')}%`; params.push(s, s, s); }
    const whereSql = whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : '';

    const [[{ count: total }]] = await sequelize.query(`SELECT COUNT(*) as count FROM users${whereSql}`, { replacements: params });
    const query = `SELECT id, email, first_name, last_name, role, avatar_url, phone, city, country, is_active, subscription_tier, created_at FROM users${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await sequelize.query(query, { replacements: [...params, pageLimit, offset] });
    res.json({ users: rows, total: parseInt(total), page: currentPage, limit: pageLimit, totalPages: Math.ceil(total / pageLimit) });
  } catch (error) {
    console.error('Get users error:', error);
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

router.put('/:id/role', auth, authorize('admin'), [
  body('role').isIn(['athlete', 'coach', 'admin']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { role } = req.body;
    await sequelize.query('UPDATE users SET role = ? WHERE id = ?', { replacements: [role, req.params.id] });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

router.put('/:id/toggle-status', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', { replacements: [req.params.id] });
    const [rows] = await sequelize.query('SELECT is_active FROM users WHERE id = ?', { replacements: [req.params.id] });
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ isActive: !!rows[0].is_active });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Failed to toggle status' });
  }
});

module.exports = router;
