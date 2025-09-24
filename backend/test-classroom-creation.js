const mongoose = require('mongoose');
require('dotenv').config();

async function createTestClassroom() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Import models
    const Teacher = require('./src/models/Teacher');
    const Classroom = require('./src/models/Classroom');
    const { generateUniquePin } = require('./src/utils/pinUtils');

    // Find or create a test teacher
    let teacher = await Teacher.findOne({ email: 'test.teacher@example.com' });
    
    if (!teacher) {
      teacher = new Teacher({
        username: 'testteacher',
        email: 'test.teacher@example.com',
        password: 'password123', // This will be hashed by the pre-save hook
        name: 'Test Teacher',
        department: 'Computer Science',
        qualification: 'M.Sc. Computer Science',
        experience: 5,
        subjects: ['Mathematics', 'Physics']
      });
      await teacher.save();
      console.log('Created test teacher:', teacher.name);
    } else {
      console.log('Found existing test teacher:', teacher.name);
    }

    // Check if test classroom already exists
    let classroom = await Classroom.findOne({ 
      name: 'Test Classroom',
      teacher: teacher._id 
    });

    if (!classroom) {
      // Generate a unique PIN
      const pin = await generateUniquePin(Classroom);
      
      // Create test classroom
      classroom = new Classroom({
        name: 'Test Classroom',
        description: 'A test classroom for PIN joining functionality',
        subject: 'Mathematics',
        grade: '10th',
        teacher: teacher._id,
        inviteCode: 'TEST123', // Required field
        pin: pin,
        pinGeneratedAt: new Date(),
        isActive: true,
        students: []
      });
      
      await classroom.save();
      console.log('Created test classroom with PIN:', pin);
    } else {
      // Update existing classroom with new PIN if it doesn't have one
      if (!classroom.pin) {
        const pin = await generateUniquePin(Classroom);
        classroom.pin = pin;
        classroom.pinGeneratedAt = new Date();
        await classroom.save();
        console.log('Updated existing classroom with PIN:', pin);
      } else {
        console.log('Existing classroom PIN:', classroom.pin);
      }
    }

    console.log('\n=== Test Classroom Details ===');
    console.log('Classroom Name:', classroom.name);
    console.log('Subject:', classroom.subject);
    console.log('Grade:', classroom.grade);
    console.log('PIN:', classroom.pin);
    console.log('Teacher:', teacher.name);
    console.log('Active:', classroom.isActive);
    console.log('Students Count:', classroom.students.length);
    console.log('\n=== Use this PIN to test joining: ' + classroom.pin + ' ===');

  } catch (error) {
    console.error('Error creating test classroom:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

createTestClassroom();
