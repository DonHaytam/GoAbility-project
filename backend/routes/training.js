const express = require('express');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/programs', async (req, res) => {
  try {
    const { disabilityType, difficulty, category } = req.query;
    let query = 'SELECT * FROM training_programs WHERE is_published = true';
    const params = [];
    let idx = 1;

    if (disabilityType) { query += ` AND disability_type = $${idx++}`; params.push(disabilityType); }
    if (difficulty) { query += ` AND difficulty = $${idx++}`; params.push(difficulty); }
    if (category) { query += ` AND category = $${idx++}`; params.push(category); }

    query += ' ORDER BY created_at DESC';

    const result = await sequelize.query(query, { bind: params });
    res.json({ programs: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get programs' });
  }
});

router.get('/programs/:id', async (req, res) => {
  try {
    const program = await sequelize.query('SELECT * FROM training_programs WHERE id = $1', { bind: [req.params.id] });
    if (!program[0].length) return res.status(404).json({ message: 'Program not found' });

    const sessions = await sequelize.query('SELECT * FROM training_sessions WHERE program_id = $1 ORDER BY week_number, day_number', { bind: [req.params.id] });
    res.json({ program: program[0][0], sessions: sessions[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get program' });
  }
});

router.post('/programs', auth, authorize('coach', 'admin'), async (req, res) => {
  try {
    const { name, description, category, disabilityType, difficulty, durationWeeks, sessionsPerWeek, price } = req.body;
    const result = await sequelize.query(
      `INSERT INTO training_programs (coach_id, name, description, category, disability_type, difficulty, duration_weeks, sessions_per_week, price, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      { bind: [req.user.id, name, description, category, disabilityType, difficulty, durationWeeks, sessionsPerWeek, price || 0, true] }
    );
    res.status(201).json({ program: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create program' });
  }
});

router.post('/enroll', auth, async (req, res) => {
  try {
    const { programId } = req.body;
    const existing = await sequelize.query(
      'SELECT id FROM user_enrollments WHERE user_id = $1 AND program_id = $2',
      { bind: [req.user.id, programId] }
    );
    if (existing[0].length) return res.status(400).json({ message: 'Already enrolled' });

    const result = await sequelize.query(
      'INSERT INTO user_enrollments (user_id, program_id) VALUES ($1, $2) RETURNING *',
      { bind: [req.user.id, programId] }
    );
    res.status(201).json({ enrollment: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to enroll' });
  }
});

router.get('/enrollments', auth, async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT e.*, p.name, p.description, p.difficulty, p.duration_weeks, p.sessions_per_week
       FROM user_enrollments e JOIN training_programs p ON e.program_id = p.id
       WHERE e.user_id = $1 ORDER BY e.started_at DESC`,
      { bind: [req.user.id] }
    );
    res.json({ enrollments: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get enrollments' });
  }
});

router.post('/progress', auth, async (req, res) => {
  try {
    const { sessionId, date, completed, durationMinutes, caloriesBurned, performanceScore, notes } = req.body;
    const result = await sequelize.query(
      `INSERT INTO user_progress (user_id, session_id, date, completed, duration_minutes, calories_burned, performance_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      { bind: [req.user.id, sessionId, date, completed || false, durationMinutes, caloriesBurned, performanceScore, notes] }
    );
    res.status(201).json({ progress: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log progress' });
  }
});

router.get('/progress', auth, async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT p.*, ts.title as session_title, tp.name as program_name
       FROM user_progress p
       LEFT JOIN training_sessions ts ON p.session_id = ts.id
       LEFT JOIN training_programs tp ON ts.program_id = tp.id
       WHERE p.user_id = $1 ORDER BY p.date DESC LIMIT 50`,
      { bind: [req.user.id] }
    );
    res.json({ progress: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get progress' });
  }
});

router.get('/athletes/:id/progress', auth, authorize('coach', 'admin'), async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT p.*, ts.title as session_title, tp.name as program_name
       FROM user_progress p
       LEFT JOIN training_sessions ts ON p.session_id = ts.id
       LEFT JOIN training_programs tp ON ts.program_id = tp.id
       WHERE p.user_id = $1 ORDER BY p.date DESC`,
      { bind: [req.params.id] }
    );
    res.json({ progress: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get athlete progress' });
  }
});

module.exports = router;
