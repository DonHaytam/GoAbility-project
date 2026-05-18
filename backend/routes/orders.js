const express = require('express');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = 'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC';
      params = [];
    } else {
      query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    }
    const result = await sequelize.query(query, { bind: params });
    res.json({ orders: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get orders' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await sequelize.query(
      'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1',
      { bind: [req.params.id] }
    );
    if (!result[0].length) return res.status(404).json({ message: 'Order not found' });

    const items = await sequelize.query(
      'SELECT oi.*, p.name, p.images FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      { bind: [req.params.id] }
    );
    res.json({ order: result[0][0], items: items[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, orderType, shippingAddress, notes } = req.body;
    if (!items || !items.length) return res.status(400).json({ message: 'No items in order' });

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.price * (item.quantity || 1);
    }

    const orderResult = await sequelize.query(
      `INSERT INTO orders (user_id, order_type, status, total_amount, shipping_address, notes)
       VALUES ($1, $2, 'pending', $3, $4, $5) RETURNING *`,
      { bind: [req.user.id, orderType || 'purchase', totalAmount, JSON.stringify(shippingAddress || {}), notes || null] }
    );

    const order = orderResult[0][0];
    for (const item of items) {
      await sequelize.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)',
        { bind: [order.id, item.productId, item.quantity || 1, item.price, item.price * (item.quantity || 1)] }
      );
    }

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    await sequelize.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      { bind: [status, req.params.id] });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order' });
  }
});

module.exports = router;
