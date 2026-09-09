const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/posts', optionalAuth, async (req, res) => {
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
    if (req.user) {
      const ids = rows.map(r => r.id);
      let likedIds = [];
      if (ids.length) {
        const [likes] = await sequelize.query(
          'SELECT post_id FROM post_likes WHERE user_id = ? AND post_id IN (?)',
          { replacements: [req.user.id, ids] }
        );
        likedIds = likes.map(l => l.post_id);
      }
      const likedSet = new Set(likedIds);
      rows.forEach(r => { r.liked = likedSet.has(r.id); });
    }
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

router.post('/posts', auth, [
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Title is required'),
  body('content').trim().notEmpty().isLength({ max: 10000 }).withMessage('Content is required'),
  body('category').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Category too long'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

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

router.post('/posts/:id/comments', auth, [
  body('content').trim().notEmpty().isLength({ max: 5000 }).withMessage('Comment content is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

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
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const [rows] = await sequelize.query(
      'SELECT e.*, u.first_name, u.last_name FROM events e LEFT JOIN users u ON e.organizer_id = u.id ORDER BY e.event_date ASC LIMIT ? OFFSET ?',
      { replacements: [limit, (page - 1) * limit] }
    );
    res.json({ events: rows, page, limit });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to get events' });
  }
});

router.post('/events', auth, [
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Title is required'),
  body('eventType').optional({ values: 'falsy' }).trim().isLength({ max: 50 }).withMessage('Event type too long'),
  body('eventDate').notEmpty().withMessage('Event date is required'),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Location too long'),
  body('maxParticipants').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

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
    const [, meta] = await sequelize.query(
      'INSERT IGNORE INTO event_registrations (id, event_id, user_id) VALUES (?, ?, ?)',
      { replacements: [id, req.params.id, req.user.id] }
    );
    if (meta && meta.affectedRows === 0) {
      return res.status(409).json({ message: 'Already registered for this event' });
    }
    const [rows] = await sequelize.query(
      'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
      { replacements: [req.params.id, req.user.id] }
    );
    res.status(201).json({ registration: rows[0] });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ message: 'Failed to register for event' });
  }
});

router.get('/associations', async (req, res) => {
  try {
    const [rows] = await sequelize.query('SELECT * FROM associations WHERE is_verified = true ORDER BY name LIMIT 100');
    res.json({ associations: rows });
  } catch (error) {
    console.error('Get associations error:', error);
    res.status(500).json({ message: 'Failed to get associations' });
  }
});

router.get('/stories', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const [rows] = await sequelize.query(
      `SELECT s.*, u.first_name, u.last_name, u.avatar_url
       FROM success_stories s JOIN users u ON s.user_id = u.id
       WHERE s.is_approved = true ORDER BY s.is_featured DESC, s.created_at DESC LIMIT ? OFFSET ?`,
      { replacements: [limit, (page - 1) * limit] }
    );
    if (req.user) {
      const ids = rows.map(r => r.id);
      let likedIds = [];
      if (ids.length) {
        const [likes] = await sequelize.query(
          'SELECT story_id FROM story_likes WHERE user_id = ? AND story_id IN (?)',
          { replacements: [req.user.id, ids] }
        );
        likedIds = likes.map(l => l.story_id);
      }
      const likedSet = new Set(likedIds);
      rows.forEach(r => { r.liked = likedSet.has(r.id); });
    }
    res.json({ stories: rows, page, limit });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Failed to get stories' });
  }
});

router.post('/stories', auth, [
  body('title').trim().notEmpty().isLength({ max: 255 }).withMessage('Title is required'),
  body('content').trim().notEmpty().isLength({ max: 10000 }).withMessage('Content is required'),
  body('imageUrl').optional({ values: 'falsy' }).isURL().withMessage('Invalid image URL'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

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
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const [rows] = await sequelize.query(
      `SELECT id, first_name, last_name, avatar_url, bio FROM users WHERE role = 'coach' AND is_active = true ORDER BY first_name LIMIT ? OFFSET ?`,
      { replacements: [limit, (page - 1) * limit] }
    );
    res.json({ mentors: rows, page, limit });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ message: 'Failed to get mentors' });
  }
});

router.post('/mentorships', auth, [
  body('mentorId').isUUID().withMessage('Invalid mentor ID'),
  body('goals').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Goals too long'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { mentorId, goals } = req.body;
    if (mentorId === req.user.id) return res.status(400).json({ message: 'Cannot request mentorship from yourself' });
    const [mentorRows] = await sequelize.query("SELECT id FROM users WHERE id = ? AND role = 'coach'", { replacements: [mentorId] });
    if (!mentorRows.length) return res.status(404).json({ message: 'Mentor not found' });

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
    const [postRows] = await sequelize.query(
      'SELECT id FROM forum_posts WHERE id = ? AND is_approved = true',
      { replacements: [req.params.id] }
    );
    if (!postRows.length) return res.status(404).json({ message: 'Post not found' });

    const result = await sequelize.transaction(async (t) => {
      const [ins] = await sequelize.query(
        'INSERT IGNORE INTO post_likes (id, post_id, user_id) VALUES (?, ?, ?)',
        { replacements: [uuidv4(), req.params.id, req.user.id], transaction: t }
      );
      if (ins.affectedRows === 1) {
        await sequelize.query('UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = ?', { replacements: [req.params.id], transaction: t });
        return { liked: true };
      }
      await sequelize.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', { replacements: [req.params.id, req.user.id], transaction: t });
      await sequelize.query('UPDATE forum_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', { replacements: [req.params.id], transaction: t });
      return { liked: false };
    });

    res.json(result);
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
    const [storyRows] = await sequelize.query(
      'SELECT id FROM success_stories WHERE id = ? AND is_approved = true',
      { replacements: [req.params.id] }
    );
    if (!storyRows.length) return res.status(404).json({ message: 'Story not found' });

    const result = await sequelize.transaction(async (t) => {
      const [ins] = await sequelize.query(
        'INSERT IGNORE INTO story_likes (id, story_id, user_id) VALUES (?, ?, ?)',
        { replacements: [uuidv4(), req.params.id, req.user.id], transaction: t }
      );
      if (ins.affectedRows === 1) {
        await sequelize.query('UPDATE success_stories SET likes_count = likes_count + 1 WHERE id = ?', { replacements: [req.params.id], transaction: t });
        return { liked: true };
      }
      await sequelize.query('DELETE FROM story_likes WHERE story_id = ? AND user_id = ?', { replacements: [req.params.id, req.user.id], transaction: t });
      await sequelize.query('UPDATE success_stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', { replacements: [req.params.id], transaction: t });
      return { liked: false };
    });

    res.json(result);
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
