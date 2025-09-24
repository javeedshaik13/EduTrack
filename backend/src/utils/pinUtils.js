/**
 * Shared PIN utility functions for classroom management (Backend)
 * Ensures consistent PIN generation and validation across the application
 */

// Characters used for PIN generation (digits + uppercase letters)
const PIN_CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PIN_LENGTH = 8;

/**
 * Generates a unique 8-character PIN using digits and uppercase letters
 * @returns {string} Generated PIN
 */
const generatePin = () => {
  let pin = '';
  for (let i = 0; i < PIN_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * PIN_CHARACTERS.length);
    pin += PIN_CHARACTERS[randomIndex];
  }
  return pin;
};

/**
 * Validates PIN format (8 characters, alphanumeric uppercase)
 * @param {string} pin - PIN to validate
 * @returns {boolean} True if PIN format is valid
 */
const isValidPinFormat = (pin) => {
  if (!pin || typeof pin !== 'string') {
    return false;
  }
  
  // Check length
  if (pin.length !== PIN_LENGTH) {
    return false;
  }
  
  // Check if all characters are valid (digits or uppercase letters)
  const validCharRegex = /^[0-9A-Z]+$/;
  return validCharRegex.test(pin);
};

/**
 * Normalizes PIN input (removes spaces, converts to uppercase)
 * @param {string} pin - Raw PIN input
 * @returns {string} Normalized PIN
 */
const normalizePin = (pin) => {
  if (!pin || typeof pin !== 'string') {
    return '';
  }
  
  return pin.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
};

/**
 * Validates PIN against database classrooms
 * @param {string} inputPin - PIN entered by student
 * @param {Object} Classroom - Mongoose Classroom model
 * @returns {Object} Validation result with success status and classroom data
 */
const validatePin = async (inputPin, Classroom) => {
  const normalizedPin = normalizePin(inputPin);
  
  // Check PIN format first
  if (!isValidPinFormat(normalizedPin)) {
    return {
      success: false,
      error: `Invalid PIN format. PIN must be exactly ${PIN_LENGTH} characters using digits and uppercase letters.`
    };
  }
  
  try {
    // Find matching classroom in database
    const matchedClassroom = await Classroom.findOne({ 
      pin: normalizedPin,
      isActive: true 
    }).populate('teacher', 'name email');
    
    if (matchedClassroom) {
      return {
        success: true,
        classroom: matchedClassroom
      };
    } else {
      return {
        success: false,
        error: 'Invalid PIN. No active classroom found with this PIN.'
      };
    }
  } catch (error) {
    console.error('Database error during PIN validation:', error);
    return {
      success: false,
      error: 'Database error occurred while validating PIN.'
    };
  }
};

/**
 * Generates a unique PIN that doesn't conflict with existing classroom PINs
 * @param {Object} Classroom - Mongoose Classroom model
 * @param {number} maxAttempts - Maximum attempts to generate unique PIN
 * @returns {string} Unique PIN
 */
const generateUniquePin = async (Classroom, maxAttempts = 100) => {
  let attempts = 0;
  let newPin;
  
  do {
    newPin = generatePin();
    attempts++;
    
    // Check if PIN already exists in database
    const existingClassroom = await Classroom.findOne({ pin: newPin });
    
    if (!existingClassroom) {
      return newPin; // PIN is unique
    }
    
    if (attempts >= maxAttempts) {
      // Fallback: add timestamp suffix to ensure uniqueness
      const timestamp = Date.now().toString().slice(-4);
      newPin = generatePin().slice(0, 4) + timestamp;
      break;
    }
  } while (attempts < maxAttempts);
  
  return newPin;
};

/**
 * Updates classroom PIN in database
 * @param {string} classroomId - Classroom ID
 * @param {string} newPin - New PIN to set
 * @param {Object} Classroom - Mongoose Classroom model
 * @returns {Object} Update result
 */
const updateClassroomPin = async (classroomId, newPin, Classroom) => {
  try {
    const updatedClassroom = await Classroom.findByIdAndUpdate(
      classroomId,
      { 
        pin: newPin,
        pinGeneratedAt: new Date()
      },
      { new: true }
    );
    
    if (updatedClassroom) {
      return {
        success: true,
        classroom: updatedClassroom,
        pin: newPin
      };
    } else {
      return {
        success: false,
        error: 'Classroom not found.'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Database error occurred while updating PIN.'
    };
  }
};

module.exports = {
  generatePin,
  generateUniquePin,
  validatePin,
  isValidPinFormat,
  normalizePin,
  updateClassroomPin,
  PIN_LENGTH,
  PIN_CHARACTERS
};
