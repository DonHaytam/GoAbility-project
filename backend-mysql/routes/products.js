const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const HTTPS_URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const imagesValidator = body('images').optional({ values: 'falsy' }).custom((images) => {
  if (!Array.isArray(images)) return true;
  for (const url of images) {
    if (typeof url !== 'string' || !HTTPS_URL_RE.test(url)) {
      throw new Error('Each image must be a valid http(s) URL');
    }
  }
  return true;
});

router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, condition, sort, page = 1, limit = 12 } = req.query;
    const whereClauses = ['is_available = true'];
    const params = [];

    if (category) { whereClauses.push('category = ?'); params.push(category); }
    if (search) { whereClauses.push('(name LIKE ? OR description LIKE ?)'); const s = `%${search.replace(/[%_]/g, '\\$&')}%`; params.push(s, s); }
    if (minPrice) { whereClauses.push('price >= ?'); params.push(parseFloat(minPrice)); }
    if (maxPrice) { whereClauses.push('price <= ?'); params.push(parseFloat(maxPrice)); }
    if (condition) { whereClauses.push('`condition` = ?'); params.push(condition); }

    const whereSql = ' WHERE ' + whereClauses.join(' AND ');

    const [[{ count: total }]] = await sequelize.query(`SELECT COUNT(*) as count FROM products${whereSql}`, { replacements: params });

    let orderSql;
    switch (sort) {
      case 'price_asc': orderSql = ' ORDER BY price ASC'; break;
      case 'price_desc': orderSql = ' ORDER BY price DESC'; break;
      case 'newest': orderSql = ' ORDER BY created_at DESC'; break;
      case 'rating': orderSql = ' ORDER BY rating DESC'; break;
      default: orderSql = ' ORDER BY featured DESC, created_at DESC';
    }

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
    const query = `SELECT * FROM products${whereSql}${orderSql} LIMIT ? OFFSET ?`;
    const [rows] = await sequelize.query(query, { replacements: [...params, pageLimit, (currentPage - 1) * pageLimit] });
    res.json({ products: rows, total: parseInt(total), page: currentPage, totalPages: Math.ceil(total / pageLimit) });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to get products' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      'SELECT * FROM products WHERE featured = true AND is_available = true ORDER BY created_at DESC LIMIT 8'
    );
    res.json({ products: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get featured products' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      'SELECT category, COUNT(*) as count FROM products WHERE is_available = true GROUP BY category ORDER BY category'
    );
    res.json({ categories: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await sequelize.query('SELECT * FROM products WHERE id = ?', { replacements: [req.params.id] });
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get product' });
  }
});

router.post('/', auth, authorize('admin'), [
  body('name').trim().notEmpty().isLength({ max: 255 }).withMessage('Product name is required'),
  body('category').trim().notEmpty().isLength({ max: 100 }).withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('rentalPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Rental price must be a non-negative number'),
  body('condition').optional({ values: 'falsy' }).isIn(['new', 'like_new', 'good', 'fair', 'poor']).withMessage('Invalid condition'),
  body('stockCount').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  imagesValidator,
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, description, category, subCategory, price, rentalPrice, isRentable, condition, brand, images, specifications, disabilityCompatibility, stockCount } = req.body;
    const id = uuidv4();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    await sequelize.query(
      `INSERT INTO products (id, seller_id, name, slug, description, category, sub_category, price, rental_price, is_rentable, \`condition\`, brand, images, specifications, disability_compatibility, stock_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [id, req.user.id, name, slug, description, category, subCategory || null, price, rentalPrice || null, isRentable || false, condition || 'new', brand || null, JSON.stringify(images || []), JSON.stringify(specifications || {}), JSON.stringify(disabilityCompatibility || []), stockCount || 1] }
    );

    const [rows] = await sequelize.query('SELECT * FROM products WHERE id = ?', { replacements: [id] });
    res.status(201).json({ product: rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

router.put('/:id', auth, authorize('admin'), [
  body('name').optional({ values: 'falsy' }).trim().isLength({ max: 255 }).withMessage('Name too long'),
  body('description').optional({ values: 'falsy' }).isLength({ max: 5000 }).withMessage('Description too long'),
  body('price').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('isAvailable').optional({ values: 'falsy' }).isBoolean().withMessage('isAvailable must be a boolean'),
  body('featured').optional({ values: 'falsy' }).isBoolean().withMessage('featured must be a boolean'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, description, price, isAvailable, featured } = req.body;
    const sanitize = (v) => v === undefined ? null : v;
    await sequelize.query(
      `UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description),
       price = COALESCE(?, price), is_available = COALESCE(?, is_available),
       featured = COALESCE(?, featured)
       WHERE id = ?`,
      { replacements: [sanitize(name), sanitize(description), sanitize(price), sanitize(isAvailable), sanitize(featured), req.params.id] }
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('DELETE FROM products WHERE id = ?', { replacements: [req.params.id] });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
