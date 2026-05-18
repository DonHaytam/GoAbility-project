const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message are required' });
    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      { replacements: [id, name, email, subject || null, message] }
    );
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await sequelize.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ messages: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

module.exports = router;
