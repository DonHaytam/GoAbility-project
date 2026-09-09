const express = require('express');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYMENT_METHODS = ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many payment attempts, please try again later' }
});

router.post('/fake-checkout', auth, checkoutLimiter, async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    if (!orderId || !UUID_RE.test(orderId)) return res.status(400).json({ message: 'Invalid orderId' });

    const [orderRows] = await sequelize.query(
      'SELECT id, user_id, total_amount, payment_status FROM orders WHERE id = ?',
      { replacements: [orderId] }
    );
    if (!orderRows.length) return res.status(404).json({ message: 'Order not found' });
    const order = orderRows[0];

    if (String(order.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to pay this order' });
    }
    if (order.payment_status === 'completed') {
      return res.status(409).json({ message: 'Order already paid' });
    }

    const method = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'credit_card';

    const id = uuidv4();
    const transactionId = 'TXN_' + uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();

    await sequelize.transaction(async (t) => {
      await sequelize.query(
        `INSERT INTO payments (id, order_id, user_id, amount, payment_method, status, transaction_id)
         VALUES (?, ?, ?, ?, ?, 'completed', ?)`,
        { replacements: [id, orderId, req.user.id, order.total_amount, method, transactionId], transaction: t }
      );
      await sequelize.query(
        "UPDATE orders SET payment_status = 'completed', status = 'confirmed', payment_method = ? WHERE id = ?",
        { replacements: [method, orderId], transaction: t }
      );
    });

    res.json({ success: true, transactionId, message: 'Payment processed successfully (demo mode)', amount: order.total_amount, currency: 'MAD' });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

router.get('/transactions', auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    let query, params;
    if (req.user.role === 'admin') {
      query = 'SELECT p.*, o.total_amount FROM payments p LEFT JOIN orders o ON p.order_id = o.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
      params = [limit, offset];
    } else {
      query = 'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params = [req.user.id, limit, offset];
    }
    const [rows] = await sequelize.query(query, { replacements: params });
    res.json({ transactions: rows, page, limit });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to get transactions' });
  }
});

module.exports = router;