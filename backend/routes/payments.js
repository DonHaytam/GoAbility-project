const express = require('express');
const { sequelize } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/fake-checkout', auth, async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: 'Missing payment details' });

    const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();

    await sequelize.query(
      `INSERT INTO payments (order_id, user_id, amount, payment_method, status, transaction_id)
       VALUES ($1, $2, $3, $4, 'completed', $5)`,
      { bind: [orderId, req.user.id, amount, paymentMethod || 'credit_card', transactionId] }
    );

    await sequelize.query(
      'UPDATE orders SET payment_status = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      { bind: ['completed', 'confirmed', orderId] }
    );

    res.json({
      success: true,
      transactionId,
      message: 'Payment processed successfully (demo mode)',
      amount,
      currency: 'MAD'
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

router.get('/transactions', auth, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = 'SELECT p.*, o.total_amount FROM payments p LEFT JOIN orders o ON p.order_id = o.id ORDER BY p.created_at DESC';
      params = [];
    } else {
      query = 'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    }
    const result = await sequelize.query(query, { bind: params });
    res.json({ transactions: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

module.exports = router;
