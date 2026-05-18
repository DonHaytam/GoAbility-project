const express = require('express');
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
    let idx = 1;

    if (category) { query += ` AND p.category = $${idx++}`; params.push(category); }
    query += ' ORDER BY p.is_pinned DESC, p.created_at DESC';
    query += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const result = await sequelize.query(query, { bind: params });
    res.json({ posts: result[0], page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get posts' });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await sequelize.query(
      `SELECT p.*, u.first_name, u.last_name, u.avatar_url, u.role
       FROM forum_posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      { bind: [req.params.id] }
    );
    if (!post[0].length) return res.status(404).json({ message: 'Post not found' });

    const comments = await sequelize.query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar_url
       FROM forum_comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 AND c.is_approved = true ORDER BY c.created_at ASC`,
      { bind: [req.params.id] }
    );

    await sequelize.query('UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1', { bind: [req.params.id] });

    res.json({ post: post[0][0], comments: comments[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get post' });
  }
});

router.post('/posts', auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const result = await sequelize.query(
      `INSERT INTO forum_posts (user_id, title, content, category, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      { bind: [req.user.id, title, content, category, tags || []] }
    );
    res.status(201).json({ post: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post' });
  }
});

router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const result = await sequelize.query(
      'INSERT INTO forum_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      { bind: [req.params.id, req.user.id, content] }
    );
    res.status(201).json({ comment: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const result = await sequelize.query(
      'SELECT e.*, u.first_name, u.last_name FROM events e LEFT JOIN users u ON e.organizer_id = u.id ORDER BY e.event_date ASC'
    );
    res.json({ events: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get events' });
  }
});

router.post('/events', auth, async (req, res) => {
  try {
    const { title, description, eventType, eventDate, location, isVirtual, maxParticipants } = req.body;
    const result = await sequelize.query(
      `INSERT INTO events (organizer_id, title, description, event_type, event_date, location, is_virtual, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      { bind: [req.user.id, title, description, eventType, eventDate, location, isVirtual || false, maxParticipants || null] }
    );
    res.status(201).json({ event: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event' });
  }
});

router.post('/events/:id/register', auth, async (req, res) => {
  try {
    const result = await sequelize.query(
      'INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      { bind: [req.params.id, req.user.id] }
    );
    res.status(201).json({ registration: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register for event' });
  }
});

router.get('/associations', async (req, res) => {
  try {
    const result = await sequelize.query('SELECT * FROM associations WHERE is_verified = true ORDER BY name');
    res.json({ associations: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get associations' });
  }
});

router.get('/stories', async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT s.*, u.first_name, u.last_name, u.avatar_url
       FROM success_stories s JOIN users u ON s.user_id = u.id
       WHERE s.is_approved = true ORDER BY s.is_featured DESC, s.created_at DESC`
    );
    res.json({ stories: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stories' });
  }
});

router.post('/stories', auth, async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;
    const result = await sequelize.query(
      'INSERT INTO success_stories (user_id, title, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      { bind: [req.user.id, title, content, imageUrl || null] }
    );
    res.status(201).json({ story: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create story' });
  }
});

router.get('/mentors', auth, async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT id, first_name, last_name, avatar_url, bio FROM users WHERE role = 'coach'`
    );
    res.json({ mentors: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get mentors' });
  }
});

router.post('/mentorships', auth, async (req, res) => {
  try {
    const { mentorId, goals } = req.body;
    const result = await sequelize.query(
      'INSERT INTO mentorships (mentor_id, mentee_id, goals) VALUES ($1, $2, $3) RETURNING *',
      { bind: [mentorId, req.user.id, goals || null] }
    );
    res.status(201).json({ mentorship: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request mentorship' });
  }
});

router.put('/posts/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('UPDATE forum_posts SET is_approved = NOT is_approved WHERE id = $1', { bind: [req.params.id] });
    res.json({ message: 'Post approval toggled' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post' });
  }
});

router.delete('/posts/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('DELETE FROM forum_posts WHERE id = $1', { bind: [req.params.id] });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

module.exports = router;
