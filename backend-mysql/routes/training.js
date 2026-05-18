const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/programs', async (req, res) => {
  try {
    const { disabilityType, difficulty, category } = req.query;
    let query = 'SELECT * FROM training_programs WHERE is_published = true';
    const params = [];

    if (disabilityType) { query += ' AND disability_type = ?'; params.push(disabilityType); }
    if (difficulty) { query += ' AND difficulty = ?'; params.push(difficulty); }
    if (category) { query += ' AND category = ?'; params.push(category); }

    query += ' ORDER BY created_at DESC';
    const [rows] = await sequelize.query(query, { replacements: params });
    res.json({ programs: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get programs' });
  }
});

router.get('/programs/:id', async (req, res) => {
  try {
    const [programRows] = await sequelize.query('SELECT * FROM training_programs WHERE id = ?', { replacements: [req.params.id] });
    if (!programRows.length) return res.status(404).json({ message: 'Program not found' });

    const [sessions] = await sequelize.query('SELECT * FROM training_sessions WHERE program_id = ? ORDER BY week_number, day_number', { replacements: [req.params.id] });
    res.json({ program: programRows[0], sessions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get program' });
  }
});

router.post('/programs', auth, authorize('coach', 'admin'), async (req, res) => {
  try {
    const { name, description, category, disabilityType, difficulty, durationWeeks, sessionsPerWeek, price } = req.body;
    const id = uuidv4();
    await sequelize.query(
      `INSERT INTO training_programs (id, coach_id, name, description, category, disability_type, difficulty, duration_weeks, sessions_per_week, price, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      { replacements: [id, req.user.id, name, description, category, disabilityType, difficulty, durationWeeks, sessionsPerWeek, price || 0] }
    );
    const [rows] = await sequelize.query('SELECT * FROM training_programs WHERE id = ?', { replacements: [id] });
    res.status(201).json({ program: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create program' });
  }
});

router.post('/enroll', auth, async (req, res) => {
  try {
    const { programId } = req.body;
    const [existing] = await sequelize.query(
      'SELECT id FROM user_enrollments WHERE user_id = ? AND program_id = ?',
      { replacements: [req.user.id, programId] }
    );
    if (existing.length) return res.status(400).json({ message: 'Already enrolled' });

    const id = uuidv4();
    await sequelize.query(
      'INSERT INTO user_enrollments (id, user_id, program_id) VALUES (?, ?, ?)',
      { replacements: [id, req.user.id, programId] }
    );
    const [rows] = await sequelize.query('SELECT * FROM user_enrollments WHERE id = ?', { replacements: [id] });
    res.status(201).json({ enrollment: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to enroll' });
  }
});

router.get('/enrollments', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT e.*, p.name, p.description, p.difficulty, p.duration_weeks, p.sessions_per_week
       FROM user_enrollments e JOIN training_programs p ON e.program_id = p.id
       WHERE e.user_id = ? ORDER BY e.started_at DESC`,
      { replacements: [req.user.id] }
    );
    res.json({ enrollments: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get enrollments' });
  }
});

router.post('/progress', auth, async (req, res) => {
  try {
    const { sessionId, date, completed, durationMinutes, caloriesBurned, performanceScore, notes } = req.body;
    const id = uuidv4();
    await sequelize.query(
      `INSERT INTO user_progress (id, user_id, session_id, date, completed, duration_minutes, calories_burned, performance_score, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [id, req.user.id, sessionId, date, completed || false, durationMinutes, caloriesBurned, performanceScore, notes] }
    );
    const [rows] = await sequelize.query('SELECT * FROM user_progress WHERE id = ?', { replacements: [id] });
    res.status(201).json({ progress: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log progress' });
  }
});

router.get('/progress', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT p.*, ts.title as session_title, tp.name as program_name
       FROM user_progress p
       LEFT JOIN training_sessions ts ON p.session_id = ts.id
       LEFT JOIN training_programs tp ON ts.program_id = tp.id
       WHERE p.user_id = ? ORDER BY p.date DESC LIMIT 50`,
      { replacements: [req.user.id] }
    );
    res.json({ progress: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get progress' });
  }
});

router.get('/athletes/:id/progress', auth, authorize('coach', 'admin'), async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT p.*, ts.title as session_title, tp.name as program_name
       FROM user_progress p
       LEFT JOIN training_sessions ts ON p.session_id = ts.id
       LEFT JOIN training_programs tp ON ts.program_id = tp.id
       WHERE p.user_id = ? ORDER BY p.date DESC`,
      { replacements: [req.params.id] }
    );
    res.json({ progress: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get athlete progress' });
  }
});

module.exports = router;
