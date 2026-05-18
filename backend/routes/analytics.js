const express = require('express');
const { sequelize } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const [totalProducts] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    const [totalOrders] = await sequelize.query('SELECT COUNT(*) as count FROM orders');
    const [totalRevenue] = await sequelize.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = $1', { bind: ['completed'] });
    const [usersByRole] = await sequelize.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    const [ordersByStatus] = await sequelize.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    const [recentOrders] = await sequelize.query(
      'SELECT o.*, u.first_name, u.last_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10'
    );
    const [monthlyRevenue] = await sequelize.query(
      `SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount) as revenue
       FROM orders WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month`
    );
    const [activeEnrollments] = await sequelize.query('SELECT COUNT(*) as count FROM user_enrollments WHERE status = $1', { bind: ['active'] });
    const [forumPosts] = await sequelize.query('SELECT COUNT(*) as count FROM forum_posts');
    const [events] = await sequelize.query('SELECT COUNT(*) as count FROM events');

    res.json({
      totalUsers: parseInt(totalUsers[0].count),
      totalProducts: parseInt(totalProducts[0].count),
      totalOrders: parseInt(totalOrders[0].count),
      totalRevenue: parseFloat(totalRevenue[0].total),
      usersByRole,
      ordersByStatus,
      recentOrders: recentOrders,
      monthlyRevenue,
      activeEnrollments: parseInt(activeEnrollments[0].count),
      forumPosts: parseInt(forumPosts[0].count),
      events: parseInt(events[0].count)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

router.get('/athlete-stats', auth, async (req, res) => {
  try {
    const [totalSessions] = await sequelize.query(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = $1', { bind: [req.user.id] }
    );
    const [completedSessions] = await sequelize.query(
      'SELECT COUNT(*) as count FROM user_progress WHERE user_id = $1 AND completed = true', { bind: [req.user.id] }
    );
    const [totalCalories] = await sequelize.query(
      'SELECT COALESCE(SUM(calories_burned), 0) as total FROM user_progress WHERE user_id = $1', { bind: [req.user.id] }
    );
    const [avgPerformance] = await sequelize.query(
      'SELECT COALESCE(AVG(performance_score), 0) as avg FROM user_progress WHERE user_id = $1 AND performance_score IS NOT NULL', { bind: [req.user.id] }
    );
    const [weeklyProgress] = await sequelize.query(
      `SELECT DATE_TRUNC('week', date) as week, COUNT(*) as sessions, 
              SUM(calories_burned) as calories, AVG(performance_score) as avg_score
       FROM user_progress WHERE user_id = $1 AND date > NOW() - INTERVAL '8 weeks'
       GROUP BY week ORDER BY week`,
      { bind: [req.user.id] }
    );
    const [activePrograms] = await sequelize.query(
      'SELECT COUNT(*) as count FROM user_enrollments WHERE user_id = $1 AND status = $2',
      { bind: [req.user.id, 'active'] }
    );

    res.json({
      totalSessions: parseInt(totalSessions[0].count),
      completedSessions: parseInt(completedSessions[0].count),
      completionRate: totalSessions[0].count > 0 ? Math.round((completedSessions[0].count / totalSessions[0].count) * 100) : 0,
      totalCalories: parseInt(totalCalories[0].total),
      avgPerformance: parseFloat(avgPerformance[0].avg).toFixed(1),
      activePrograms: parseInt(activePrograms[0].count),
      weeklyProgress
    });
  } catch (error) {
    console.error('Athlete stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

module.exports = router;
