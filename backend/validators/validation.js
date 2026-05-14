const { body } = require('express-validator');

const validateFeedback = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('category')
    .isIn(['General', 'Work Environment', 'Management', 'Compensation', 'Benefits', 'Career Development', 'Other'])
    .withMessage('Invalid category'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department name too long')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
];

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['employee', 'admin'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department name too long')
];

module.exports = {
  validateFeedback,
  validateLogin,
  validateRegister
};