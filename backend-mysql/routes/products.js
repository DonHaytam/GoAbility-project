const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, condition, sort, page = 1, limit = 12 } = req.query;
    let query = 'SELECT * FROM products WHERE is_available = true';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; const s = `%${search.replace(/[%_]/g, '\\$&')}%`; params.push(s, s); }
    if (minPrice) { query += ' AND price >= ?'; params.push(parseFloat(minPrice)); }
    if (maxPrice) { query += ' AND price <= ?'; params.push(parseFloat(maxPrice)); }
    if (condition) { query += ' AND `condition` = ?'; params.push(condition); }

    const [countRows] = await sequelize.query(query.replace('SELECT *', 'SELECT COUNT(*) as count'), { replacements: params });
    const total = countRows[0].count;

    switch (sort) {
      case 'price_asc': query += ' ORDER BY price ASC'; break;
      case 'price_desc': query += ' ORDER BY price DESC'; break;
      case 'newest': query += ' ORDER BY created_at DESC'; break;
      case 'rating': query += ' ORDER BY rating DESC'; break;
      default: query += ' ORDER BY featured DESC, created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));

    const [rows] = await sequelize.query(query, { replacements: params });
    res.json({ products: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
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

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
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

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
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
