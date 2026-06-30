import { body, param, query, validationResult } from 'express-validator';

// Express validator error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg).join(', ') });
  }
  next();
};

// Login Validation Rules
export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Forgot Password validation placeholder (if route exists or added)
export const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  handleValidationErrors
];

// School Registration Validation Rules
export const schoolValidation = [
  body('name').trim().notEmpty().withMessage('School name is required'),
  body('subdomain').trim().notEmpty().withMessage('Subdomain is required').matches(/^[a-z0-9-]+$/i).withMessage('Subdomain must be alphanumeric with optional dashes'),
  body('adminEmail').isEmail().withMessage('Invalid administrator email address'),
  body('adminUsername').trim().notEmpty().withMessage('Admin username is required'),
  body('adminPassword')
    .isLength({ min: 8 }).withMessage('Admin password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Admin password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Admin password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Admin password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Admin password must contain at least one special character'),
  handleValidationErrors
];

// Student Registration Validation Rules
export const studentValidation = [
  body('firstName').trim().notEmpty().withMessage('Student first name is required'),
  body('admissionNumber').trim().notEmpty().withMessage('Admission number is required'),
  body('studentClass').trim().notEmpty().withMessage('Target class is required'),
  handleValidationErrors
];

// Teacher/Staff Registration Validation Rules
export const teacherValidation = [
  body('firstName').trim().notEmpty().withMessage('Teacher first name is required'),
  body('lastName').trim().notEmpty().withMessage('Teacher last name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid teacher email address'),
  handleValidationErrors
];
