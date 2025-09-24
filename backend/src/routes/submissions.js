const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Student = require('../models/Student');

// Create or get submission for an assignment
router.post('/start/:assignmentId', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user._id;

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId).populate('classroom');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check if student is in the classroom
    const student = await Student.findById(studentId);
    const isEnrolled = student.classrooms.some(c => c.toString() === assignment.classroom._id.toString());
    
    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        error: 'Not enrolled in this classroom'
      });
    }

    // Check if submission already exists
    let submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (!submission) {
      // Create new submission
      submission = new Submission({
        assignment: assignmentId,
        student: studentId,
        classroom: assignment.classroom._id,
        maxScore: assignment.totalPoints,
        status: 'draft'
      });
      await submission.save();
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Start submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start submission'
    });
  }
});

// Submit assignment answers
router.post('/submit/:submissionId', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { answers } = req.body;
    const studentId = req.user._id;

    const submission = await Submission.findOne({
      _id: submissionId,
      student: studentId
    }).populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (submission.status === 'submitted') {
      return res.status(400).json({
        success: false,
        error: 'Assignment already submitted'
      });
    }

    // Process answers
    submission.answers = answers.map(answer => ({
      questionId: answer.questionId,
      questionType: answer.questionType,
      answer: answer.answer,
      selectedOption: answer.selectedOption,
      maxPoints: answer.maxPoints || 1,
      points: 0, // Will be calculated during grading
      isCorrect: false // Will be determined during grading
    }));

    // Submit the assignment
    submission.status = 'submitted';
    submission.submittedAt = new Date();
    
    // Check if late
    if (submission.assignment.dueDate && submission.submittedAt > submission.assignment.dueDate) {
      submission.isLate = true;
    }

    await submission.save();

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit assignment'
    });
  }
});

// Get submission details
router.get('/:submissionId', authenticate, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = { _id: submissionId };
    
    // Students can only see their own submissions
    if (userRole === 'student') {
      query.student = userId;
    }

    const submission = await Submission.findOne(query)
      .populate('assignment', 'title questions totalPoints dueDate')
      .populate('student', 'name email')
      .populate('classroom', 'name subject');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get submission'
    });
  }
});

// Grade submission (teachers only)
router.post('/grade/:submissionId', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grades, feedback } = req.body;
    const teacherId = req.user._id;

    const submission = await Submission.findById(submissionId)
      .populate('assignment')
      .populate('classroom');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Verify teacher owns the classroom
    if (submission.classroom.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update answer grades
    if (grades && Array.isArray(grades)) {
      grades.forEach(grade => {
        const answer = submission.answers.id(grade.answerId);
        if (answer) {
          answer.points = grade.points;
          answer.isCorrect = grade.points === answer.maxPoints;
          if (grade.feedback) {
            answer.manualGrade = {
              points: grade.points,
              feedback: grade.feedback,
              gradedBy: teacherId,
              gradedAt: new Date()
            };
          }
        }
      });
    }

    // Add teacher feedback
    if (feedback) {
      submission.teacherFeedback = {
        overallFeedback: feedback.overall,
        suggestions: feedback.suggestions || [],
        feedbackBy: teacherId,
        feedbackAt: new Date()
      };
    }

    submission.status = 'graded';
    await submission.save();

    res.json({
      success: true,
      message: 'Submission graded successfully',
      data: submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grade submission'
    });
  }
});

module.exports = router;
