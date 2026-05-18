const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/fake-checkout', auth, async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: 'Missing payment details' });

    const id = uuidv4();
    const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();

    await sequelize.query(
      `INSERT INTO payments (id, order_id, user_id, amount, payment_method, status, transaction_id)
       VALUES (?, ?, ?, ?, ?, 'completed', ?)`,
      { replacements: [id, orderId, req.user.id, amount, paymentMethod || 'credit_card', transactionId] }
    );

    await sequelize.query(
      "UPDATE orders SET payment_status = 'completed', status = 'confirmed' WHERE id = ?",
      { replacements: [orderId] }
    );

    res.json({ success: true, transactionId, message: 'Payment processed successfully (demo mode)', amount, currency: 'MAD' });
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
      query = 'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC';
      params = [req.user.id];
    }
    const [rows] = await sequelize.query(query, { replacements: params });
    res.json({ transactions: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

module.exports = router;
