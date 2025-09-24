const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getDashboardStats,
  getRecentActivity,
  getTeacherOverview,
  getTeacherSubmissions
} = require('../controllers/dashboardController');

// All dashboard routes require teacher authentication
router.use(authenticate);
router.use(requireRole('teacher'));

router.get('/stats', getDashboardStats);

// GET /api/dashboard/recent-activity - Get recent activity
router.get('/recent-activity', getRecentActivity);

// GET /api/dashboard/overview - Get teacher overview
router.get('/overview', getTeacherOverview);

// GET /api/dashboard/submissions - Get teacher submissions
router.get('/submissions', getTeacherSubmissions);

module.exports = router;
