const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validatePin } = require('../utils/pinUtils');

// POST /api/student/classrooms/join - Student joins classroom using PIN
router.post('/join', authenticate, async (req, res) => {
  try {
    const { pin } = req.body;
    const studentId = req.user._id;
    
    console.log('Join classroom request:', { pin, studentId, userRole: req.user.role });
    
    // Validate required fields
    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN is required'
      });
    }
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student authentication required'
      });
    }
    
    const Classroom = require('../models/Classroom');
    
    // Validate PIN using shared utility
    console.log('Original PIN:', pin);
    console.log('PIN length:', pin.length);
    const validationResult = await validatePin(pin, Classroom);
    console.log('PIN validation result:', validationResult);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error
      });
    }
    
    const classroom = validationResult.classroom;
    
    // Check if student is already in classroom
    const isAlreadyJoined = classroom.students.some(student => 
      student.studentId.toString() === studentId.toString()
    );
    
    if (isAlreadyJoined) {
      return res.json({
        success: true,
        data: {
          classroomName: classroom.name,
          message: 'Already joined this classroom'
        }
      });
    }
    
    // Add student to classroom with proper structure
    classroom.students.push({
      studentId: studentId,
      joinedAt: new Date(),
      isActive: true
    });
    
    console.log('Saving classroom with new student...');
    await classroom.save();
    console.log('Classroom saved successfully');
    
    // Add classroom to student's classrooms
    const Student = require('../models/Student');
    console.log('Updating student record...');
    const updateResult = await Student.findByIdAndUpdate(
      studentId,
      { $addToSet: { classrooms: classroom._id } },
      { new: true }
    );
    console.log('Student update result:', updateResult ? 'Success' : 'Failed');
    
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

// POST /api/student/classrooms/validate-pin - Validate PIN without joining
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

// GET /api/student/classrooms - Get student's enrolled classrooms
router.get('/', authenticate, async (req, res) => {
  try {
    const studentId = req.user._id;
    const Student = require('../models/Student');
    
    const student = await Student.findById(studentId).populate({
      path: 'classrooms',
      populate: {
        path: 'teacher',
        select: 'name email'
      }
    });
    
    if (student && student.classrooms) {
      res.json({
        success: true,
        data: student.classrooms
      });
    } else {
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Error fetching student classrooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch classrooms'
    });
  }
});

module.exports = router;
