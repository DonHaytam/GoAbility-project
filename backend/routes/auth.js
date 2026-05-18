const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

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

    const existing = await sequelize.query(
      'SELECT id FROM users WHERE email = $1',
      { bind: [email.toLowerCase()] }
    );

    if (existing[0].length) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await sequelize.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, city) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, first_name, last_name, role, created_at`,
      { bind: [email.toLowerCase(), passwordHash, firstName, lastName, role || 'athlete', sanitize(phone), sanitize(city)] }
    );

    const user = result[0][0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: isProd ? 'Registration failed' : error.message });
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

    const result = await sequelize.query(
      'SELECT id, email, password_hash, first_name, last_name, role, avatar_url, is_active FROM users WHERE email = $1',
      { bind: [email.toLowerCase()] }
    );

    if (!result[0].length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = result[0][0];

    if (!user.is_active) return res.status(401).json({ message: 'Account is deactivated' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT id, email, first_name, last_name, role, avatar_url, phone, 
              date_of_birth, gender, city, country, bio, is_active, 
              subscription_tier, created_at
       FROM users WHERE id = $1`,
      { bind: [req.user.id] }
    );

    if (!result[0].length) return res.status(404).json({ message: 'User not found' });

    const u = result[0][0];
    res.json({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      avatarUrl: u.avatar_url,
      phone: u.phone,
      dateOfBirth: u.date_of_birth,
      gender: u.gender,
      city: u.city,
      country: u.country,
      bio: u.bio,
      isActive: u.is_active,
      subscriptionTier: u.subscription_tier,
      createdAt: u.created_at
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

router.post('/logout', auth, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict'
  });
  res.json({ message: 'Logged out successfully' });
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, city, country, bio, dateOfBirth, gender } = req.body;

    await sequelize.query(
      `UPDATE users SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        city = COALESCE($4, city),
        country = COALESCE($5, country),
        bio = COALESCE($6, bio),
        date_of_birth = COALESCE($7, date_of_birth),
        gender = COALESCE($8, gender),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      { bind: [sanitize(firstName), sanitize(lastName), sanitize(phone), sanitize(city), sanitize(country), sanitize(bio), sanitize(dateOfBirth), sanitize(gender), req.user.id] }
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
