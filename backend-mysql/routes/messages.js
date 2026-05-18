const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/inbox', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar_url
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.receiver_id = ? ORDER BY m.created_at DESC`,
      { replacements: [req.user.id] }
    );
    res.json({ messages: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get inbox' });
  }
});

router.get('/sent', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar_url
       FROM messages m JOIN users u ON m.receiver_id = u.id
       WHERE m.sender_id = ? ORDER BY m.created_at DESC`,
      { replacements: [req.user.id] }
    );
    res.json({ messages: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get sent messages' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ message: 'Receiver and content required' });
    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
      { replacements: [id, req.user.id, receiverId, content] }
    );
    const [rows] = await sequelize.query('SELECT * FROM messages WHERE id = ?', { replacements: [id] });
    res.status(201).json({ message: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    await sequelize.query('UPDATE messages SET is_read = true WHERE id = ? AND receiver_id = ?',
      { replacements: [req.params.id, req.user.id] });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.userId;
    const [rows] = await sequelize.query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar_url,
        CASE WHEN m.sender_id = ? THEN 'sent' ELSE 'received' END as direction
       FROM messages m JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      { replacements: [userId, userId, userId, otherId, otherId, userId] }
    );
    const [partnerRows] = await sequelize.query(
      'SELECT id, first_name, last_name, avatar_url FROM users WHERE id = ?',
      { replacements: [otherId] }
    );
    res.json({ messages: rows, partner: partnerRows[0] || null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get conversation' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = false',
      { replacements: [req.user.id] }
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

module.exports = router;
