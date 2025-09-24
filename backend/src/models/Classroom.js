const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  
  // Teacher Information
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  
  // Invite System
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 6,
    maxlength: 8,
    index: true
  },
  
  // PIN System for classroom joining
  pin: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    minlength: 8,
    maxlength: 8,
    index: true
  },
  pinGeneratedAt: {
    type: Date
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Students
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Classroom Resources
  materials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  
  // Statistics
  stats: {
    totalStudents: { type: Number, default: 0 },
    activeStudents: { type: Number, default: 0 },
    totalMaterials: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    averagePerformance: { type: Number, default: 0 }
  },
  
  // Settings
  settings: {
    allowStudentDiscussion: { type: Boolean, default: true },
    allowAnonymousQuestions: { type: Boolean, default: true },
    autoGrading: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true },
    allowLateSubmissions: { type: Boolean, default: true },
    maxStudents: { type: Number, default: 50 }
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  
  // Schedule (optional)
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: String,
    endTime: String,
    timezone: { type: String, default: 'UTC' }
  }
}, {
  timestamps: true
});

// Indexes for performance
classroomSchema.index({ teacher: 1 });
classroomSchema.index({ subject: 1, grade: 1 });
classroomSchema.index({ 'students.studentId': 1 });

// Generate unique invite code
classroomSchema.pre('save', async function(next) {
  if (!this.inviteCode) {
    let code;
    let exists = true;
    
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingClassroom = await mongoose.model('Classroom').findOne({ inviteCode: code });
      exists = !!existingClassroom;
    }
    
    this.inviteCode = code;
  }
  next();
});

// Update stats before saving
classroomSchema.pre('save', function(next) {
  this.stats.totalStudents = this.students.length;
  this.stats.activeStudents = this.students.filter(s => s.isActive).length;
  next();
});

// Methods
classroomSchema.methods.addStudent = function(studentId) {
  const existingStudent = this.students.find(s => s.studentId.toString() === studentId.toString());
  if (!existingStudent) {
    this.students.push({ studentId });
    this.stats.totalStudents = this.students.length;
    this.stats.activeStudents = this.students.filter(s => s.isActive).length;
  }
  return this.save();
};

classroomSchema.methods.removeStudent = function(studentId) {
  this.students = this.students.filter(s => s.studentId.toString() !== studentId.toString());
  this.stats.totalStudents = this.students.length;
  this.stats.activeStudents = this.students.filter(s => s.isActive).length;
  return this.save();
};

classroomSchema.methods.getActiveStudents = function() {
  return this.students.filter(s => s.isActive);
};

// Virtual for student count
classroomSchema.virtual('studentCount').get(function() {
  return this.students.length;
});

module.exports = mongoose.model('Classroom', classroomSchema);
