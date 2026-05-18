const express = require('express');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const [[{ count: totalUsers }]] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: totalProducts }]] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    const [[{ count: totalOrders }]] = await sequelize.query('SELECT COUNT(*) as count FROM orders');
    const [[{ total: totalRevenue }]] = await sequelize.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'completed'");
    const [usersByRole] = await sequelize.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const [ordersByStatus] = await sequelize.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    const [recentOrders] = await sequelize.query(
      'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10'
    );
    const [monthlyRevenue] = await sequelize.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-01') as month, SUM(total_amount) as revenue
       FROM orders WHERE payment_status = 'completed' AND created_at > DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-01') ORDER BY month`
    );
    const [[{ count: activeEnrollments }]] = await sequelize.query("SELECT COUNT(*) as count FROM user_enrollments WHERE status = 'active'");
    const [[{ count: forumPosts }]] = await sequelize.query('SELECT COUNT(*) as count FROM forum_posts');
    const [[{ count: events }]] = await sequelize.query('SELECT COUNT(*) as count FROM events');

    res.json({
      totalUsers: parseInt(totalUsers),
      totalProducts: parseInt(totalProducts),
      totalOrders: parseInt(totalOrders),
      totalRevenue: parseFloat(totalRevenue),
      usersByRole, ordersByStatus, recentOrders, monthlyRevenue,
      activeEnrollments: parseInt(activeEnrollments),
      forumPosts: parseInt(forumPosts),
      events: parseInt(events)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

router.get('/athlete-stats', auth, async (req, res) => {
  try {
    const [[{ count: totalSessions }]] = await sequelize.query('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ?', { replacements: [req.user.id] });
    const [[{ count: completedSessions }]] = await sequelize.query('SELECT COUNT(*) as count FROM user_progress WHERE user_id = ? AND completed = true', { replacements: [req.user.id] });
    const [[{ total: totalCalories }]] = await sequelize.query('SELECT COALESCE(SUM(calories_burned), 0) as total FROM user_progress WHERE user_id = ?', { replacements: [req.user.id] });
    const [[{ avg: avgPerformance }]] = await sequelize.query('SELECT COALESCE(AVG(performance_score), 0) as avg FROM user_progress WHERE user_id = ? AND performance_score IS NOT NULL', { replacements: [req.user.id] });
    const [weeklyProgress] = await sequelize.query(
      `SELECT DATE_FORMAT(date, '%Y-%u') as week, COUNT(*) as sessions,
              SUM(calories_burned) as calories, AVG(performance_score) as avg_score
       FROM user_progress WHERE user_id = ? AND date > DATE_SUB(NOW(), INTERVAL 8 WEEK)
       GROUP BY DATE_FORMAT(date, '%Y-%u') ORDER BY week`,
      { replacements: [req.user.id] }
    );
    const [[{ count: activePrograms }]] = await sequelize.query("SELECT COUNT(*) as count FROM user_enrollments WHERE user_id = ? AND status = 'active'", { replacements: [req.user.id] });

    res.json({
      totalSessions: parseInt(totalSessions),
      completedSessions: parseInt(completedSessions),
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      totalCalories: parseInt(totalCalories),
      avgPerformance: parseFloat(avgPerformance).toFixed(1),
      activePrograms: parseInt(activePrograms),
      weeklyProgress
    });
  } catch (error) {
    console.error('Athlete stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

module.exports = router;
