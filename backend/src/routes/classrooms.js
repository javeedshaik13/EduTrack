const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { generateUniquePin, validatePin } = require('../utils/pinUtils');
const {
  createClassroom,
  getClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
  removeStudent,
  generateInviteCode,
  assignToClassroom
} = require('../controllers/classroomController');

// Most classroom routes require teacher authentication
// Note: /join and /validate-pin routes are handled separately for students

// POST /api/classrooms - Create new classroom
router.post('/', authenticate, requireRole('teacher'), createClassroom);

// GET /api/classrooms - Get all classrooms for teacher
router.get('/', authenticate, requireRole('teacher'), getClassrooms);

// GET /api/classrooms/:classroomId - Get specific classroom
router.get('/:classroomId', authenticate, requireRole('teacher'), getClassroomById);

// GET /api/classrooms/:classroomId/students - Get classroom students
router.get('/:classroomId/students', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;
    
    const Classroom = require('../models/Classroom');
    const Student = require('../models/Student');
    
    // Verify classroom ownership
    const classroom = await Classroom.findOne({
      _id: classroomId,
      teacher: teacherId
    });
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found or access denied'
      });
    }
    
    // Get students from classroom.students array
    const studentIds = classroom.students.map(s => s.studentId);
    const students = await Student.find({ _id: { $in: studentIds } })
      .select('name email studentId grade avatar')
      .lean();
    
    // Combine student data with classroom-specific info
    const studentsWithClassroomInfo = students.map(student => {
      const classroomStudent = classroom.students.find(s => 
        s.studentId.toString() === student._id.toString()
      );
      
      return {
        ...student,
        joinedAt: classroomStudent?.joinedAt,
        isActive: classroomStudent?.isActive || true
      };
    });
    
    res.json({
      success: true,
      data: studentsWithClassroomInfo
    });
  } catch (error) {
    console.error('Error fetching classroom students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students'
    });
  }
});

// GET /api/classrooms/:classroomId/assignments - Get classroom assignments
router.get('/:classroomId/assignments', authenticate, requireRole('teacher'), (req, res) => {
  // Return empty array for now - assignments will be populated from classroom data
  res.json({ success: true, data: [] });
});

// DELETE /api/classrooms/:classroomId/students/:studentId - Remove student from classroom
router.delete('/:classroomId/students/:studentId', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;
    const teacherId = req.user._id;
    
    const Classroom = require('../models/Classroom');
    const Student = require('../models/Student');
    
    // Verify classroom ownership
    const classroom = await Classroom.findOne({
      _id: classroomId,
      teacher: teacherId
    });
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found or access denied'
      });
    }
    
    // Remove student from classroom.students array
    classroom.students = classroom.students.filter(s => 
      s.studentId.toString() !== studentId.toString()
    );
    await classroom.save();
    
    // Remove classroom from student's classrooms array
    await Student.findByIdAndUpdate(
      studentId,
      { $pull: { classrooms: classroomId } }
    );
    
    res.json({
      success: true,
      message: 'Student removed from classroom successfully'
    });
  } catch (error) {
    console.error('Error removing student from classroom:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove student'
    });
  }
});

// GET /api/classrooms/:classroomId/materials - Get classroom materials
router.get('/:classroomId/materials', authenticate, requireRole('teacher'), (req, res) => {
  // Return empty array for now - materials will be populated from classroom data
  res.json({ success: true, data: [] });
});

// POST /api/classrooms/:classroomId/generate-pin - Generate new PIN for classroom
router.post('/:classroomId/generate-pin', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;
    
    const Classroom = require('../models/Classroom');
    
    // Verify classroom ownership
    const classroom = await Classroom.findOne({
      _id: classroomId,
      teacher: teacherId
    });
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found or access denied'
      });
    }
    
    // Generate unique PIN
    const newPin = await generateUniquePin(Classroom);
    
    // Update classroom with new PIN
    classroom.pin = newPin;
    classroom.pinGeneratedAt = new Date();
    await classroom.save();
    
    res.json({
      success: true,
      data: {
        pin: newPin,
        classroomName: classroom.name,
        generatedAt: classroom.pinGeneratedAt
      }
    });
  } catch (error) {
    console.error('Error generating PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PIN'
    });
  }
});

// GET /api/classrooms/:classroomId/analytics - Get classroom analytics
router.get('/:classroomId/analytics', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const teacherId = req.user._id;
    
    const Classroom = require('../models/Classroom');
    const Assignment = require('../models/Assignment');
    const Submission = require('../models/Submission');
    
    // Verify classroom ownership
    const classroom = await Classroom.findOne({
      _id: classroomId,
      teacher: teacherId
    });
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found or access denied'
      });
    }
    
    // Get assignments for this classroom
    const assignments = await Assignment.find({ classroom: classroomId });
    const assignmentIds = assignments.map(a => a._id);
    
    // Get submissions for these assignments
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds }
    });
    
    // Calculate statistics
    const totalStudents = classroom.students.length;
    const totalAssignments = assignments.length;
    
    // Calculate average score from graded submissions
    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.percentage !== undefined);
    const averageScore = gradedSubmissions.length > 0 
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.percentage, 0) / gradedSubmissions.length)
      : 0;
    
    // Calculate completion rate
    const totalPossibleSubmissions = totalStudents * totalAssignments;
    const actualSubmissions = submissions.filter(s => s.status !== 'draft').length;
    const completionRate = totalPossibleSubmissions > 0 
      ? Math.round((actualSubmissions / totalPossibleSubmissions) * 100)
      : 0;
    
    // Recent activity
    const recentSubmissions = submissions
      .filter(s => s.submittedAt && new Date(s.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .length;
    
    const recentJoins = classroom.students
      .filter(s => s.joinedAt && new Date(s.joinedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .length;
    
    res.json({
      success: true,
      data: {
        totalStudents,
        totalAssignments,
        averageScore,
        completionRate,
        recentActivity: {
          submissionsThisWeek: recentSubmissions,
          newStudentsThisWeek: recentJoins
        },
        submissions: {
          total: submissions.length,
          graded: gradedSubmissions.length,
          pending: submissions.filter(s => s.status === 'submitted').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching classroom analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// PUT /api/classrooms/:classroomId - Update classroom
router.put('/:classroomId', authenticate, requireRole('teacher'), updateClassroom);

// DELETE /api/classrooms/:classroomId - Delete classroom
router.delete('/:classroomId', authenticate, requireRole('teacher'), deleteClassroom);

// DELETE /api/classrooms/:classroomId/students/:studentId - Remove student from classroom
router.delete('/:classroomId/students/:studentId', authenticate, requireRole('teacher'), removeStudent);

// GET /api/classrooms/:classroomId/invite-code - Get classroom invite code
router.get('/:classroomId/invite-code', authenticate, requireRole('teacher'), generateInviteCode);

// POST /api/classrooms/:classroomId/invite-code - Generate new invite code (for frontend compatibility)
router.post('/:classroomId/invite-code', authenticate, requireRole('teacher'), generateInviteCode);

// POST /api/classrooms/:classroomId/assign - Assign assignment to classroom
router.post('/:classroomId/assign', authenticate, requireRole('teacher'), assignToClassroom);

// POST /api/classrooms/:classroomId/generate-pin - Generate new PIN for classroom
router.post('/:classroomId/generate-pin', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { classroomId } = req.params;
    const Classroom = require('../models/Classroom');
    
    // Generate unique PIN using shared utility
    const newPin = await generateUniquePin(Classroom);
    
    // Update classroom with new PIN
    const updatedClassroom = await Classroom.findByIdAndUpdate(
      classroomId,
      { 
        pin: newPin,
        pinGeneratedAt: new Date()
      },
      { new: true }
    );
    
    if (updatedClassroom) {
      res.json({
        success: true,
        data: {
          pin: newPin,
          classroomId: classroomId,
          generatedAt: new Date()
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }
  } catch (error) {
    console.error('Error generating PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PIN'
    });
  }
});

// POST /api/classrooms/join - Student joins classroom using PIN
router.post('/join', authenticate, async (req, res) => {
  try {
    const { pin } = req.body;
    const studentId = req.user.id;
    const Classroom = require('../models/Classroom');
    const User = require('../models/User');
    
    // Validate PIN using shared utility
    const validationResult = await validatePin(pin, Classroom);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error
      });
    }
    
    const classroom = validationResult.classroom;
    
    // Check if student is already in classroom
    if (classroom.students.includes(studentId)) {
      return res.json({
        success: true,
        data: {
          classroomName: classroom.name,
          message: 'Already joined this classroom'
        }
      });
    }
    
    // Add student to classroom
    classroom.students.push(studentId);
    await classroom.save();
    
    // Add classroom to student's enrolled classrooms
    await User.findByIdAndUpdate(
      studentId,
      { $addToSet: { enrolledClassrooms: classroom._id } }
    );
    
    res.json({
      success: true,
      data: {
        classroomName: classroom.name,
        classroomId: classroom._id,
        subject: classroom.subject
      }
    });
    
  } catch (error) {
    console.error('Error joining classroom:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join classroom'
    });
  }
});

// POST /api/classrooms/validate-pin - Validate PIN without joining
router.post('/validate-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const Classroom = require('../models/Classroom');
    
    // Validate PIN using shared utility
    const validationResult = await validatePin(pin, Classroom);
    
    if (validationResult.success) {
      res.json({
        success: true,
        data: {
          classroomName: validationResult.classroom.name,
          subject: validationResult.classroom.subject,
          teacherName: validationResult.classroom.teacher.name
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: validationResult.error
      });
    }
  } catch (error) {
    console.error('Error validating PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate PIN'
    });
  }
});

module.exports = router;
