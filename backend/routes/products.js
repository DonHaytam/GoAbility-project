const express = require('express');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, condition, sort, page = 1, limit = 12 } = req.query;
    let query = 'SELECT * FROM products WHERE is_available = true';
    const params = [];
    let idx = 1;

    if (category) {
      query += ` AND category = $${idx++}`;
      params.push(category);
    }
    if (search) {
      query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (minPrice) {
      query += ` AND price >= $${idx++}`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND price <= $${idx++}`;
      params.push(parseFloat(maxPrice));
    }
    if (condition) {
      query += ` AND condition = $${idx++}`;
      params.push(condition);
    }

    const countResult = await sequelize.query(query.replace('SELECT *', 'SELECT COUNT(*)'), { bind: params });
    const total = parseInt(countResult[0][0].count);

    switch (sort) {
      case 'price_asc': query += ' ORDER BY price ASC'; break;
      case 'price_desc': query += ' ORDER BY price DESC'; break;
      case 'newest': query += ' ORDER BY created_at DESC'; break;
      case 'rating': query += ' ORDER BY rating DESC'; break;
      default: query += ' ORDER BY featured DESC, created_at DESC';
    }

    query += ` LIMIT $${idx++} OFFSET $${idx++}`;
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const result = await sequelize.query(query, { bind: params });
    res.json({ products: result[0], total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to get products' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const result = await sequelize.query(
      'SELECT * FROM products WHERE featured = true AND is_available = true ORDER BY created_at DESC LIMIT 8'
    );
    res.json({ products: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get featured products' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await sequelize.query(
      'SELECT category, COUNT(*) as count FROM products WHERE is_available = true GROUP BY category ORDER BY category'
    );
    res.json({ categories: result[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await sequelize.query(
      'SELECT * FROM products WHERE id = $1',
      { bind: [req.params.id] }
    );
    if (!result[0].length) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: result[0][0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get product' });
  }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, description, category, subCategory, price, rentalPrice, isRentable, condition, brand, images, specifications, disabilityCompatibility, stockCount } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    
    const result = await sequelize.query(
      `INSERT INTO products (seller_id, name, slug, description, category, sub_category, price, rental_price, is_rentable, condition, brand, images, specifications, disability_compatibility, stock_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      { bind: [req.user.id, name, slug, description, category, subCategory, price, rentalPrice || null, isRentable || false, condition || 'new', brand || null, images || [], JSON.stringify(specifications || {}), disabilityCompatibility || [], stockCount || 1] }
    );
    res.status(201).json({ product: result[0][0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

const sanitize = (v) => v === undefined ? null : v;

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, description, price, isAvailable, featured } = req.body;
    await sequelize.query(
      `UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), 
       price = COALESCE($3, price), is_available = COALESCE($4, is_available),
       featured = COALESCE($5, featured), updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      { bind: [sanitize(name), sanitize(description), sanitize(price), sanitize(isAvailable), sanitize(featured), req.params.id] }
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await sequelize.query('DELETE FROM products WHERE id = $1', { bind: [req.params.id] });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
