const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const replacements = [limit, offset];
    let query;
    if (req.user.role === 'admin') {
      query = 'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    } else {
      query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      replacements.unshift(req.user.id);
    }
    const [rows] = await sequelize.query(query, { replacements });
    res.json({ orders: rows, page, limit });
  } catch (error) {
    console.error('Get orders error:', error);
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
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to get order' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { items, orderType, shippingAddress, notes, paymentMethod } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'No items in order' });

    const type = orderType === 'rental' ? 'rental' : 'purchase';

    const normalizedItems = [];
    for (const item of items) {
      if (!item.productId || !UUID_RE.test(item.productId)) {
        return res.status(400).json({ message: 'Invalid productId' });
      }
      const quantity = parseInt(item.quantity, 10);
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        return res.status(400).json({ message: 'Invalid quantity' });
      }
      normalizedItems.push({ productId: item.productId, quantity });
    }

    const placeholders = normalizedItems.map(() => '?').join(', ');
    const [productRows] = await sequelize.query(
      `SELECT id, price, rental_price, stock_count, is_available FROM products WHERE id IN (${placeholders})`,
      { replacements: normalizedItems.map(i => i.productId) }
    );
    const productsById = new Map(productRows.map(p => [p.id, p]));

    let totalAmount = 0;
    const orderItems = [];
    for (const item of normalizedItems) {
      const product = productsById.get(item.productId);
      if (!product || !product.is_available) {
        return res.status(400).json({ message: 'Product not available for purchase' });
      }
      const unitPrice = type === 'rental' && product.rental_price ? Number(product.rental_price) : Number(product.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ message: 'Product has an invalid price' });
      }
      if (type !== 'rental' && product.stock_count < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for item: ${item.productId}` });
      }
      orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice });
      totalAmount += unitPrice * item.quantity;
    }

    const orderId = uuidv4();
    await sequelize.transaction(async (t) => {
      await sequelize.query(
        `INSERT INTO orders (id, user_id, order_type, status, total_amount, shipping_address, notes, payment_method)
         VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
        {
          replacements: [orderId, req.user.id, type, totalAmount.toFixed(2), JSON.stringify(shippingAddress || {}), notes || null, paymentMethod || null],
          transaction: t
        }
      );

      for (const oi of orderItems) {
        const itemId = uuidv4();
        await sequelize.query(
          'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
          { replacements: [itemId, orderId, oi.productId, oi.quantity, oi.unitPrice.toFixed(2), (oi.unitPrice * oi.quantity).toFixed(2)], transaction: t }
        );
        if (type !== 'rental') {
          await sequelize.query(
            'UPDATE products SET stock_count = stock_count - ? WHERE id = ? AND stock_count >= ?',
            { replacements: [oi.quantity, oi.productId, oi.quantity], transaction: t }
          );
        }
      }
    });

    const [rows] = await sequelize.query('SELECT * FROM orders WHERE id = ?', { replacements: [orderId] });
    res.status(201).json({ order: rows[0] });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

router.put('/:id/status', auth, authorize('admin'), [
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { status } = req.body;
    await sequelize.query('UPDATE orders SET status = ? WHERE id = ?', { replacements: [status, req.params.id] });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

module.exports = router;