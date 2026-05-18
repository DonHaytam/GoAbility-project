const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let query;
    const replacements = [];
    if (req.user.role === 'admin') {
      query = 'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC';
    } else {
      query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
      replacements.push(req.user.id);
    }
    const [rows] = await sequelize.query(query, { replacements });
    res.json({ orders: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get orders' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const [orderRows] = await sequelize.query(
      'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ? AND (o.user_id = ? OR ? = ?)',
      { replacements: [req.params.id, req.user.id, req.user.role, 'admin'] }
    );
    if (!orderRows.length) return res.status(404).json({ message: 'Order not found' });

    const [items] = await sequelize.query(
      'SELECT oi.*, p.name, p.images FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      { replacements: [req.params.id] }
    );
    res.json({ order: orderRows[0], items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, orderType, shippingAddress, notes } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'No items in order' });

    for (const item of items) {
      if (typeof item.price !== 'number' || item.price < 0) {
        return res.status(400).json({ message: 'Invalid item price' });
      }
    }
    let totalAmount = 0;
    for (const item of items) totalAmount += item.price * (item.quantity ?? 1);

    const orderId = uuidv4();
    await sequelize.query(
      `INSERT INTO orders (id, user_id, order_type, status, total_amount, shipping_address, notes)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
      { replacements: [orderId, req.user.id, orderType || 'purchase', totalAmount, JSON.stringify(shippingAddress || {}), notes || null] }
    );

    for (const item of items) {
      const itemId = uuidv4();
      await sequelize.query(
        'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
        { replacements: [itemId, orderId, item.productId, item.quantity ?? 1, item.price, item.price * (item.quantity ?? 1)] }
      );
    }

    const [rows] = await sequelize.query('SELECT * FROM orders WHERE id = ?', { replacements: [orderId] });
    res.status(201).json({ order: rows[0] });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    await sequelize.query('UPDATE orders SET status = ? WHERE id = ?', { replacements: [status, req.params.id] });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' });
  }
});

module.exports = router;
