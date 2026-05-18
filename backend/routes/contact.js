const express = require('express');
const { sequelize } = require('../config/database');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }
    await sequelize.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)',
      { bind: [name, email, subject || null, message] }
    );
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await sequelize.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ messages: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages' });
  }
});

module.exports = router;
