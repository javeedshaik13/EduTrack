const Student = require('../models/Student');
const { assignmentsData, announcementsData, performanceData } = require('../data/seedData');

// Get student dashboard data
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const Assignment = require('../models/Assignment');
    const Submission = require('../models/Submission');
    const Classroom = require('../models/Classroom');
    
    // Get student with populated classrooms
    const student = await Student.findById(studentId).populate('classrooms');
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    // Get all assignments from student's classrooms
    const classroomIds = student.classrooms.map(c => c._id);
    const assignments = await Assignment.find({
      classroom: { $in: classroomIds }
    }).populate('classroom', 'name subject')
     .sort({ dueDate: 1 });

    // Get student's submissions
    const submissions = await Submission.find({
      student: studentId
    }).populate('assignment', 'title dueDate totalPoints');

    // Calculate dynamic stats
    const totalAssignments = assignments.length;
    const submittedAssignments = submissions.filter(s => s.status !== 'draft').length;
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    const completedAssignments = gradedSubmissions.length;
    
    // Calculate average score
    const averageScore = gradedSubmissions.length > 0 
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.percentage, 0) / gradedSubmissions.length)
      : 0;

    // Calculate total points earned
    const totalPoints = gradedSubmissions.reduce((sum, s) => sum + s.score, 0);

    // Get pending assignments (not submitted yet)
    const submittedAssignmentIds = submissions.map(s => s.assignment._id.toString());
    const pendingAssignments = assignments.filter(a => 
      !submittedAssignmentIds.includes(a._id.toString()) && 
      new Date(a.dueDate) > new Date()
    );

    // Get recent assignments (last 5)
    const recentAssignments = assignments.slice(0, 5).map(assignment => {
      const submission = submissions.find(s => s.assignment._id.toString() === assignment._id.toString());
      return {
        _id: assignment._id,
        title: assignment.title,
        subject: assignment.classroom.subject,
        classroomName: assignment.classroom.name,
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        status: submission ? submission.status : 'pending',
        score: submission ? submission.score : null,
        percentage: submission ? submission.percentage : null
      };
    });

    // Get upcoming deadlines (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingDeadlines = pendingAssignments
      .filter(a => new Date(a.dueDate) <= nextWeek)
      .slice(0, 5)
      .map(assignment => ({
        _id: assignment._id,
        title: assignment.title,
        subject: assignment.classroom.subject,
        dueDate: assignment.dueDate,
        daysLeft: Math.ceil((new Date(assignment.dueDate) - today) / (1000 * 60 * 60 * 24))
      }));

    // Update student stats
    const updatedStats = {
      totalAssignments,
      completedAssignments,
      pendingAssignments: pendingAssignments.length,
      averageScore,
      totalPoints,
      streak: student.stats.streak || 0,
      longestStreak: student.stats.longestStreak || 0,
      rank: student.stats.rank || null,
      level: Math.floor(totalPoints / 100) + 1 // Level up every 100 points
    };

    // Update student record with new stats
    await Student.findByIdAndUpdate(studentId, {
      'stats.totalAssignments': totalAssignments,
      'stats.completedAssignments': completedAssignments,
      'stats.pendingAssignments': pendingAssignments.length,
      'stats.averageScore': averageScore,
      'stats.totalPoints': totalPoints,
      'stats.level': updatedStats.level
    });

    // Dashboard summary data
    const dashboardData = {
      success: true,
      data: {
        student: {
          name: student.name,
          grade: student.grade,
          avatar: student.avatar,
          studentId: student.studentId,
          stats: updatedStats,
          badges: student.badges || []
        },
        classrooms: student.classrooms.map(c => ({
          _id: c._id,
          name: c.name,
          subject: c.subject,
          studentsCount: c.students ? c.students.length : 0
        })),
        recentAssignments,
        upcomingDeadlines,
        summary: {
          totalAssignments,
          completedAssignments,
          pendingAssignments: pendingAssignments.length,
          averageScore,
          totalPoints,
          classroomsCount: student.classrooms.length
        }
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// Get student assignments
const getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { status, subject } = req.query;
    const Assignment = require('../models/Assignment');
    const Submission = require('../models/Submission');
    
    // Get student with populated classrooms
    const student = await Student.findById(studentId).populate('classrooms');
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    // Get all assignments from student's classrooms
    const classroomIds = student.classrooms.map(c => c._id);
    let query = { classroom: { $in: classroomIds } };
    
    // Add subject filter if provided
    if (subject) {
      query.subject = subject;
    }
    
    const assignments = await Assignment.find(query)
      .populate('classroom', 'name subject')
      .sort({ dueDate: 1 });

    // Get student's submissions
    const submissions = await Submission.find({
      student: studentId
    }).populate('assignment', 'title dueDate totalPoints');

    // Process assignments with submission status
    const processedAssignments = assignments.map(assignment => {
      const submission = submissions.find(s => s.assignment._id.toString() === assignment._id.toString());
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      
      let assignmentStatus = 'pending';
      if (submission) {
        assignmentStatus = submission.status;
      } else if (dueDate < now) {
        assignmentStatus = 'overdue';
      }
      
      return {
        id: assignment._id,
        _id: assignment._id,
        title: assignment.title,
        subject: assignment.classroom.subject,
        classroomName: assignment.classroom.name,
        dueDate: assignment.dueDate,
        status: assignmentStatus,
        difficulty: assignment.difficulty || 'medium',
        points: assignment.totalPoints,
        totalPoints: assignment.totalPoints,
        description: assignment.description,
        score: submission ? submission.score : null,
        percentage: submission ? submission.percentage : null,
        submittedAt: submission ? submission.submittedAt : null,
        doubts: [] // This would be populated from a doubts collection
      };
    });

    // Apply status filter if provided
    let filteredAssignments = processedAssignments;
    if (status) {
      filteredAssignments = processedAssignments.filter(a => a.status === status);
    }

    res.json({
      success: true,
      data: filteredAssignments
    });
  } catch (error) {
    console.error('Assignments error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

// Get student performance data
const getStudentPerformance = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const performanceReport = {
      overview: {
        averageScore: student.stats.averageScore,
        rank: student.stats.rank,
        totalPoints: student.stats.totalPoints,
        level: student.stats.level,
        streak: student.stats.streak,
        completionRate: student.getCompletionPercentage()
      },
      subjects: student.subjects,
      weeklyProgress: performanceData.weeklyProgress,
      subjectPerformance: performanceData.subjectPerformance,
      monthlyTrends: [
        { month: 'Jan', score: 78 },
        { month: 'Feb', score: 82 },
        { month: 'Mar', score: 85 },
        { month: 'Apr', score: 88 }
      ],
      achievements: student.badges.map(badge => ({
        name: badge,
        description: getBadgeDescription(badge),
        earnedAt: new Date()
      }))
    };

    res.json(performanceReport);
  } catch (error) {
    console.error('Performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get student profile
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'address', 'preferences', 'guardian'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const student = await Student.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      student 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get student announcements
const getStudentAnnouncements = async (req, res) => {
  try {
    const announcements = announcementsData.map(announcement => ({
      ...announcement,
      id: Math.random().toString(36).substr(2, 9),
      readAt: Math.random() > 0.5 ? new Date() : null
    }));

    res.json({
      announcements,
      unreadCount: announcements.filter(a => !a.readAt).length
    });
  } catch (error) {
    console.error('Announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, attachments } = req.body;

    // Simulate assignment submission
    const submission = {
      id: Math.random().toString(36).substr(2, 9),
      assignmentId: id,
      studentId: req.user._id,
      content,
      attachments: attachments || [],
      submittedAt: new Date(),
      status: 'submitted',
      grade: null,
      feedback: null
    };

    res.json({
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Assignment submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get student doubts
const getStudentDoubt = async (req, res) => {
  try {
    const doubts = [
      {
        id: '1',
        title: 'Quadratic Formula Confusion',
        subject: 'Mathematics',
        description: 'I am having trouble understanding when to use the quadratic formula vs factoring',
        status: 'open',
        createdAt: new Date(),
        responses: []
      },
      {
        id: '2',
        title: 'Chemical Bonding Types',
        subject: 'Science',
        description: 'Can someone explain the difference between ionic and covalent bonds?',
        status: 'resolved',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        responses: [
          {
            id: '1',
            content: 'Ionic bonds form between metals and non-metals...',
            author: 'Teacher',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ];

    res.json({ doubts });
  } catch (error) {
    console.error('Doubts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new doubt
const createDoubt = async (req, res) => {
  try {
    const { title, subject, description } = req.body;

    const doubt = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      subject,
      description,
      studentId: req.user._id,
      status: 'open',
      createdAt: new Date(),
      responses: []
    };

    res.status(201).json({
      message: 'Doubt created successfully',
      doubt
    });
  } catch (error) {
    console.error('Create doubt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update streak
const updateStreak = async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.updateStreak();
    await student.save();

    res.json({
      success: true,
      message: 'Streak updated successfully',
      data: {
        streak: student.stats.streak,
        longestStreak: student.stats.longestStreak
      }
    });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update streak'
    });
  }
};

// Update student stats
const updateStudentStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get all student's submissions
    const submissions = await Submission.find({ student: studentId })
      .populate('assignment', 'totalPoints subject');
    
    // Calculate stats
    const totalAssignments = submissions.length;
    const completedAssignments = submissions.filter(s => s.status === 'graded' || s.status === 'submitted').length;
    const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
    
    let averageScore = 0;
    let totalPoints = 0;
    
    if (gradedSubmissions.length > 0) {
      const totalScorePercentage = gradedSubmissions.reduce((sum, sub) => {
        const assignment = sub.assignment;
        if (assignment && assignment.totalPoints > 0) {
          return sum + (sub.score / assignment.totalPoints) * 100;
        }
        return sum;
      }, 0);
      averageScore = Math.round(totalScorePercentage / gradedSubmissions.length);
      totalPoints = gradedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    }
    
    // Calculate rank (simplified - based on average score and total points)
    const allStudents = await Student.find({}, 'stats').lean();
    const studentRanking = allStudents
      .map(s => ({
        id: s._id,
        score: s.stats.averageScore || 0,
        points: s.stats.totalPoints || 0
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.points - a.points;
      });
    
    const rank = studentRanking.findIndex(s => s.id.toString() === studentId.toString()) + 1;
    
    // Update badges based on achievements
    const badges = [];
    if (averageScore >= 90) badges.push('achiever');
    if (completedAssignments >= 5) badges.push('dedicated');
    if (req.user.stats.streak >= 7) badges.push('consistent');
    
    // Update student stats
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          'stats.totalAssignments': totalAssignments,
          'stats.completedAssignments': completedAssignments,
          'stats.pendingAssignments': Math.max(0, totalAssignments - completedAssignments),
          'stats.averageScore': averageScore,
          'stats.totalPoints': totalPoints,
          'stats.rank': rank,
          badges: badges
        }
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Student stats updated successfully',
      data: updatedStudent.stats
    });
  } catch (error) {
    console.error('Update student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student stats'
    });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const student = await Student.findById(studentId).populate('submissions');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Update streak on dashboard access
    student.updateStreak();
    await student.save();
    
    // Get recent assignments
    const recentAssignments = await Assignment.find({
      classroom: { $in: student.classrooms },
      status: 'active'
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('teacher', 'name');
    
    res.json({
      success: true,
      data: {
        stats: student.stats,
        badges: student.badges,
        recentAssignments
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
};

// Helper function to get badge descriptions
const getBadgeDescription = (badge) => {
  const descriptions = {
    consistent: 'Maintained a study streak for multiple days',
    achiever: 'Consistently scored above 85% in assignments',
    creator: 'Actively participated in creative projects',
    helper: 'Helped fellow students with their doubts',
    early_bird: 'Consistently submitted assignments before deadline',
    perfectionist: 'Achieved perfect scores in multiple assignments',
    dedicated: 'Showed exceptional dedication to studies'
  };
  return descriptions[badge] || 'Achievement unlocked';
};

module.exports = {
  getStudentDashboard,
  getStudentAssignments,
  getStudentPerformance,
  getStudentProfile,
  updateStudentProfile,
  getStudentAnnouncements,
  submitAssignment,
  getStudentDoubt,
  createDoubt,
  updateStreak,
  updateStudentStats,
  getDashboardStats
};
