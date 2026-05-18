const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();
const isProdAuth = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' }
});

const sanitize = (v) => v === undefined ? null : v;

router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1, max: 100 }).escape().withMessage('First name required'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).escape().withMessage('Last name required'),
  body('role').optional().isIn(['athlete', 'coach']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password, firstName, lastName, role, phone, city } = req.body;

    const [existing] = await sequelize.query(
      'SELECT id FROM users WHERE email = ?',
      { replacements: [email.toLowerCase()] }
    );
    if (existing.length) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = uuidv4();

    await sequelize.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, phone, city) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [id, email.toLowerCase(), passwordHash, firstName, lastName, role || 'athlete', sanitize(phone), sanitize(city)] }
    );

    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      token,
      user: { id, email: email.toLowerCase(), firstName, lastName, role: role || 'athlete' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: isProdAuth ? 'Registration failed' : error.message });
  }
});

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;

    const [rows] = await sequelize.query(
      'SELECT id, email, password_hash, first_name, last_name, role, avatar_url, is_active FROM users WHERE email = ?',
      { replacements: [email.toLowerCase()] }
    );
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    if (!user.is_active) return res.status(401).json({ message: 'Account is deactivated' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token,
      user: {
        id: user.id, email: user.email, firstName: user.first_name,
        lastName: user.last_name, role: user.role, avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT id, email, first_name, last_name, role, avatar_url, phone, 
              date_of_birth, gender, city, country, bio, is_active, 
              subscription_tier, created_at
       FROM users WHERE id = ?`,
      { replacements: [req.user.id] }
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const u = rows[0];
    res.json({
      id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
      role: u.role, avatarUrl: u.avatar_url, phone: u.phone, dateOfBirth: u.date_of_birth,
      gender: u.gender, city: u.city, country: u.country, bio: u.bio,
      isActive: u.is_active, subscriptionTier: u.subscription_tier, createdAt: u.created_at
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user' });
  }
});

router.post('/logout', auth, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProdAuth,
    sameSite: 'strict'
  });
  res.json({ message: 'Logged out successfully' });
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, city, country, bio, dateOfBirth, gender } = req.body;
    await sequelize.query(
      `UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        bio = COALESCE(?, bio),
        date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender)
       WHERE id = ?`,
      { replacements: [sanitize(firstName), sanitize(lastName), sanitize(phone), sanitize(city), sanitize(country), sanitize(bio), sanitize(dateOfBirth), sanitize(gender), req.user.id] }
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
