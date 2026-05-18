const express = require('express');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    let query = 'SELECT id, email, first_name, last_name, role, avatar_url, phone, city, country, is_active, subscription_tier, created_at FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      params.push(role);
    }
    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex++;
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const result = await sequelize.query(query, { bind: params });
    res.json({ users: result[0], page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

router.get('/athletes', auth, authorize('coach', 'admin'), async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT id, email, first_name, last_name, avatar_url, city, bio 
       FROM users WHERE role = 'athlete' AND is_active = true 
       ORDER BY created_at DESC`
    );
    res.json({ athletes: result[0] });
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ message: 'Failed to get athletes' });
  }
});

router.get('/coaches', auth, async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT id, email, first_name, last_name, avatar_url, city, bio 
       FROM users WHERE role = 'coach' AND is_active = true 
       ORDER BY first_name`
    );
    res.json({ coaches: result[0] });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({ message: 'Failed to get coaches' });
  }
});

router.put('/:id/role', auth, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    await sequelize.query('UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      { bind: [role, req.params.id] });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

router.put('/:id/toggle-status', auth, authorize('admin'), async (req, res) => {
  try {
    const result = await sequelize.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING is_active',
      { bind: [req.params.id] }
    );
    res.json({ isActive: result[0][0].is_active });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle status' });
  }
});

module.exports = router;
