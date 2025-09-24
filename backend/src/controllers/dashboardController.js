const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const Material = require('../models/Material');
const Submission = require('../models/Submission');
const RecentActivity = require('../models/RecentActivity');

const getDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get teacher's classrooms
    const classrooms = await Classroom.find({ teacher: teacherId });
    const classroomIds = classrooms.map(c => c._id);

    // Get assignments for all teacher's classrooms
    const assignments = await Assignment.find({ 
      $or: [
        { teacher: teacherId },
        { classroom: { $in: classroomIds } }
      ]
    });
    const assignmentIds = assignments.map(a => a._id);

    // Get submissions for teacher's assignments
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds }
    });

    // Calculate dynamic statistics
    const stats = {
      activeClassrooms: classrooms.length,
      totalStudents: 0,
      assignmentsCreated: assignments.length,
      materialsUploaded: 0,
      totalSubmissions: submissions.length,
      pendingSubmissions: 0,
      gradedSubmissions: 0,
      averageScore: 0,
      completionRate: 0,
      recentActivity: {
        submissionsThisWeek: 0,
        newStudentsThisWeek: 0,
        assignmentsThisWeek: 0
      }
    };

    // Count total students across all classrooms
    for (const classroom of classrooms) {
      stats.totalStudents += classroom.students.length;
    }

    // Count materials uploaded by teacher
    stats.materialsUploaded = await Material.countDocuments({ 
      teacher: teacherId 
    });

    // Calculate submission statistics
    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.percentage !== undefined);
    const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
    
    stats.gradedSubmissions = gradedSubmissions.length;
    stats.pendingSubmissions = pendingSubmissions.length;

    // Calculate average score
    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.percentage, 0);
      stats.averageScore = Math.round(totalScore / gradedSubmissions.length);
    }

    // Calculate completion rate
    const totalPossibleSubmissions = stats.totalStudents * assignments.length;
    if (totalPossibleSubmissions > 0) {
      const completedSubmissions = submissions.filter(s => s.status !== 'draft').length;
      stats.completionRate = Math.round((completedSubmissions / totalPossibleSubmissions) * 100);
    }

    // Calculate recent activity (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    stats.recentActivity.submissionsThisWeek = submissions.filter(s => 
      s.submittedAt && new Date(s.submittedAt) > oneWeekAgo
    ).length;

    stats.recentActivity.assignmentsThisWeek = assignments.filter(a => 
      new Date(a.createdAt) > oneWeekAgo
    ).length;

    // Count new students this week
    for (const classroom of classrooms) {
      stats.recentActivity.newStudentsThisWeek += classroom.students.filter(s => 
        s.joinedAt && new Date(s.joinedAt) > oneWeekAgo
      ).length;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const activities = await RecentActivity.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('relatedId', 'title name')
      .lean();

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
};

const getTeacherOverview = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get comprehensive teacher data
    const teacher = await Teacher.findById(teacherId)
      .select('-password')
      .lean();

    const classrooms = await Classroom.find({ teacher: teacherId })
      .populate('students', 'name email avatar')
      .lean();

    const assignments = await Assignment.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const materials = await Material.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentActivity = await RecentActivity.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('relatedId', 'title name')
      .lean();

    // Calculate performance metrics
    const totalStudents = classrooms.reduce((sum, classroom) => sum + classroom.students.length, 0);
    const totalAssignments = await Assignment.countDocuments({ teacher: teacherId });
    const totalMaterials = await Material.countDocuments({ teacher: teacherId });

    res.json({
      success: true,
      data: {
        teacher,
        stats: {
          activeClassrooms: classrooms.length,
          totalStudents,
          assignmentsCreated: totalAssignments,
          materialsUploaded: totalMaterials
        },
        classrooms,
        recentAssignments: assignments,
        recentMaterials: materials,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Teacher overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher overview'
    });
  }
};

const getTeacherSubmissions = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { limit = 20, status, subject } = req.query;

    // Get teacher's classrooms and assignments
    const classrooms = await Classroom.find({ teacher: teacherId });
    const classroomIds = classrooms.map(c => c._id);
    
    const assignments = await Assignment.find({ 
      $or: [
        { teacher: teacherId },
        { classroom: { $in: classroomIds } }
      ]
    }).populate('classroom', 'name subject');
    
    const assignmentIds = assignments.map(a => a._id);

    // Build query for submissions
    let submissionQuery = { assignment: { $in: assignmentIds } };
    if (status) {
      submissionQuery.status = status;
    }

    // Get submissions with student and assignment details
    const submissions = await Submission.find(submissionQuery)
      .populate('student', 'name email avatar')
      .populate('assignment', 'title dueDate totalPoints')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Add classroom and subject info to submissions
    const enrichedSubmissions = submissions.map(submission => {
      const assignment = assignments.find(a => a._id.toString() === submission.assignment._id.toString());
      return {
        ...submission,
        subject: assignment?.classroom?.subject || 'Unknown',
        classroomName: assignment?.classroom?.name || 'Unknown',
        assignmentTitle: submission.assignment.title,
        studentName: submission.student?.name || 'Unknown Student',
        totalPoints: submission.assignment.totalPoints,
        score: submission.score,
        percentage: submission.percentage,
        submittedAt: submission.submittedAt,
        status: submission.status
      };
    });

    // Filter by subject if specified
    const filteredSubmissions = subject && subject !== 'all' 
      ? enrichedSubmissions.filter(s => s.subject === subject)
      : enrichedSubmissions;

    res.json({
      success: true,
      data: filteredSubmissions
    });
  } catch (error) {
    console.error('Teacher submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher submissions'
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getTeacherOverview,
  getTeacherSubmissions
};
