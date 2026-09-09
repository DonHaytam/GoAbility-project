const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many contact messages, please try again later' }
});

router.post('/', contactLimiter, [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('subject').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Subject too long'),
  body('message').trim().notEmpty().isLength({ max: 5000 }).withMessage('Message is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, subject, message } = req.body;
    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      { replacements: [id, name, email, subject || null, message] }
    );
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send contact message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const [rows] = await sequelize.query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ? OFFSET ?',
      { replacements: [limit, (page - 1) * limit] }
    );
    res.json({ messages: rows, page, limit });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

module.exports = router;