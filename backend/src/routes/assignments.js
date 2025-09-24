const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getSubmissions,
  gradeSubmission,
  getStudentAssignments,
  submitAssignment,
  analyzeAssignment
} = require('../controllers/assignmentController');

const {
  getDoubts,
  answerDoubt,
  updateDoubtStatus,
  deleteDoubt
} = require('../controllers/doubtController');

// Apply authentication to all routes
router.use(authenticate);

// POST /api/assignments - Create new assignment (teacher only)
router.post('/', requireRole('teacher'), upload.array('attachments', 5), createAssignment);

// GET /api/assignments - Get assignments (role-specific)
router.get('/', (req, res, next) => {
  if (req.user.role === 'teacher') {
    return getAssignments(req, res, next);
  } else {
    return getStudentAssignments(req, res, next);
  }
});

// GET /api/assignments/:assignmentId - Get specific assignment (teacher only)
router.get('/:assignmentId', requireRole('teacher'), getAssignmentById);

// PUT /api/assignments/:assignmentId - Update assignment (teacher only)
router.put('/:assignmentId', requireRole('teacher'), updateAssignment);

// DELETE /api/assignments/:assignmentId - Delete assignment (teacher only)
router.delete('/:assignmentId', requireRole('teacher'), deleteAssignment);

// GET /api/assignments/:assignmentId/submissions - Get submissions for assignment (teacher only)
router.get('/:assignmentId/submissions', requireRole('teacher'), getSubmissions);

// GET /api/assignments/:assignmentId/analyze - Analyze assignment submissions (teacher only)
router.get('/:assignmentId/analyze', requireRole('teacher'), analyzeAssignment);

// POST /api/assignments/submissions/:submissionId/grade - Grade a submission (teacher only)
router.post('/submissions/:submissionId/grade', requireRole('teacher'), gradeSubmission);

// POST /api/assignments/:assignmentId/submit - Submit assignment (students)
router.post('/:assignmentId/submit', upload.array('attachments', 5), submitAssignment);

// Doubt routes for assignments (frontend compatibility)
// GET /api/assignments/:assignmentId/doubts - Get doubts for assignment (teacher only)
router.get('/:assignmentId/doubts', requireRole('teacher'), getDoubts);

// POST /api/assignments/:assignmentId/doubts - Create doubt for assignment
router.post('/:assignmentId/doubts', (req, res) => {
  // This would be handled by student routes, but adding for completeness
  res.status(501).json({ success: false, message: 'Not implemented for teacher portal' });
});

module.exports = router;
