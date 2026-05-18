const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/posts', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let query = `SELECT p.*, u.first_name, u.last_name, u.avatar_url,
      (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comment_count
      FROM forum_posts p JOIN users u ON p.user_id = u.id WHERE p.is_approved = true`;
    const params = [];

    if (category) { query += ' AND p.category = ?'; params.push(category); }
    query += ' ORDER BY p.is_pinned DESC, p.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const [rows] = await sequelize.query(query, { replacements: params });
    res.json({ posts: rows, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get posts' });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const [postRows] = await sequelize.query(
      `SELECT p.*, u.first_name, u.last_name, u.avatar_url, u.role
       FROM forum_posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      { replacements: [req.params.id] }
    );
    if (!postRows.length) return res.status(404).json({ message: 'Post not found' });

    const [comments] = await sequelize.query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url
       FROM forum_comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.is_approved = true ORDER BY c.created_at ASC`,
      { replacements: [req.params.id] }
    );

    await sequelize.query('UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ?', { replacements: [req.params.id] });
    res.json({ post: postRows[0], comments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get post' });
  }
});

router.post('/posts', auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const id = uuidv4();
    await sequelize.query(
      `INSERT INTO forum_posts (id, user_id, title, content, category, tags) VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: [id, req.user.id, title, content, category, JSON.stringify(tags || [])] }
    );
    const [rows] = await sequelize.query('SELECT * FROM forum_posts WHERE id = ?', { replacements: [id] });
    res.status(201).json({ post: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post' });
  }
});

router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO forum_comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)',
      { replacements: [id, req.params.id, req.user.id, content] }
    );
    const [rows] = await sequelize.query('SELECT * FROM forum_comments WHERE id = ?', { replacements: [id] });
    res.status(201).json({ comment: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      'SELECT e.*, u.first_name, u.last_name FROM events e LEFT JOIN users u ON e.organizer_id = u.id ORDER BY e.event_date ASC'
    );
    res.json({ events: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get events' });
  }
});

router.post('/events', auth, async (req, res) => {
  try {
    const { title, description, eventType, eventDate, location, isVirtual, maxParticipants } = req.body;
    const id = uuidv4();
    await sequelize.query(
      `INSERT INTO events (id, organizer_id, title, description, event_type, event_date, location, is_virtual, max_participants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [id, req.user.id, title, description, eventType, eventDate, location, isVirtual || false, maxParticipants || null] }
    );
    const [rows] = await sequelize.query('SELECT * FROM events WHERE id = ?', { replacements: [id] });
    res.status(201).json({ event: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event' });
  }
});

router.post('/events/:id/register', auth, async (req, res) => {
  try {
    const id = uuidv4();
    await sequelize.query(
      'INSERT IGNORE INTO event_registrations (id, event_id, user_id) VALUES (?, ?, ?)',
      { replacements: [id, req.params.id, req.user.id] }
    );
    const [rows] = await sequelize.query('SELECT * FROM event_registrations WHERE id = ?', { replacements: [id] });
    res.status(201).json({ registration: rows[0] || { id, event_id: req.params.id, user_id: req.user.id } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register for event' });
  }
});

router.get('/associations', async (req, res) => {
  try {
    const [rows] = await sequelize.query('SELECT * FROM associations WHERE is_verified = true ORDER BY name');
    res.json({ associations: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get associations' });
  }
});

router.get('/stories', async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT s.*, u.first_name, u.last_name, u.avatar_url
       FROM success_stories s JOIN users u ON s.user_id = u.id
       WHERE s.is_approved = true ORDER BY s.is_featured DESC, s.created_at DESC`
    );
    res.json({ stories: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stories' });
  }
});

router.post('/stories', auth, async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;
    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO success_stories (id, user_id, title, content, image_url) VALUES (?, ?, ?, ?, ?)',
      { replacements: [id, req.user.id, title, content, imageUrl || null] }
    );
    const [rows] = await sequelize.query('SELECT * FROM success_stories WHERE id = ?', { replacements: [id] });
    res.status(201).json({ story: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create story' });
  }
});

router.get('/mentors', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT id, first_name, last_name, avatar_url, bio FROM users WHERE role = 'coach'`
    );
    res.json({ mentors: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get mentors' });
  }
});

router.post('/mentorships', auth, async (req, res) => {
  try {
    const { mentorId, goals } = req.body;
    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO mentorships (id, mentor_id, mentee_id, goals) VALUES (?, ?, ?, ?)',
      { replacements: [id, mentorId, req.user.id, goals || null] }
    );
    const [rows] = await sequelize.query('SELECT * FROM mentorships WHERE id = ?', { replacements: [id] });
    res.status(201).json({ mentorship: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request mentorship' });
  }
});

router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const [existing] = await sequelize.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', { replacements: [req.params.id, req.user.id] });
    if (existing.length) {
      await sequelize.query('DELETE FROM post_likes WHERE id = ?', { replacements: [existing[0].id] });
      await sequelize.query('UPDATE forum_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', { replacements: [req.params.id] });
      res.json({ liked: false });
    } else {
      const id = uuidv4();
      await sequelize.query('INSERT INTO post_likes (id, post_id, user_id) VALUES (?, ?, ?)', { replacements: [id, req.params.id, req.user.id] });
      await sequelize.query('UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = ?', { replacements: [req.params.id] });
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

router.get('/posts/:id/liked', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', { replacements: [req.params.id, req.user.id] });
    res.json({ liked: !!rows.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check like' });
  }
});

router.post('/stories/:id/like', auth, async (req, res) => {
  try {
    const [existing] = await sequelize.query('SELECT id FROM story_likes WHERE story_id = ? AND user_id = ?', { replacements: [req.params.id, req.user.id] });
    if (existing.length) {
      await sequelize.query('DELETE FROM story_likes WHERE id = ?', { replacements: [existing[0].id] });
      await sequelize.query('UPDATE success_stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', { replacements: [req.params.id] });
      res.json({ liked: false });
    } else {
      const id = uuidv4();
      await sequelize.query('INSERT INTO story_likes (id, story_id, user_id) VALUES (?, ?, ?)', { replacements: [id, req.params.id, req.user.id] });
      await sequelize.query('UPDATE success_stories SET likes_count = likes_count + 1 WHERE id = ?', { replacements: [req.params.id] });
      res.json({ liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

router.put('/posts/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('UPDATE forum_posts SET is_approved = NOT is_approved WHERE id = ?', { replacements: [req.params.id] });
    res.json({ message: 'Post approval toggled' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post' });
  }
});

router.delete('/posts/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('DELETE FROM forum_posts WHERE id = ?', { replacements: [req.params.id] });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

module.exports = router;
