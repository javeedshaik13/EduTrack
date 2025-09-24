const mongoose = require('mongoose');
require('dotenv').config();

async function checkClassroomPin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    // Import models
    const Classroom = require('./src/models/Classroom');

    // Find all classrooms
    const classrooms = await Classroom.find({});

    console.log('\n=== Classrooms with PINs ===');
    classrooms.forEach(classroom => {
      console.log(`Classroom: ${classroom.name}`);
      console.log(`Subject: ${classroom.subject}`);
      console.log(`PIN: "${classroom.pin}"`);
      console.log(`PIN Length: ${classroom.pin ? classroom.pin.length : 'N/A'}`);
      console.log(`Active: ${classroom.isActive}`);
      console.log(`Teacher: ${classroom.teacher ? classroom.teacher.name : 'N/A'}`);
      console.log('---');
    });

    if (classrooms.length === 0) {
      console.log('No classrooms with PINs found');
    }

  } catch (error) {
    console.error('Error checking classroom PINs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

checkClassroomPin();
