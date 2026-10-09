const { body } = require("express-validator");

const createStudentValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[A-Za-zÀ-ÿ\s'-]+$/)
    .withMessage("First name contains invalid characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[A-Za-zÀ-ÿ\s'-]+$/)
    .withMessage("Last name contains invalid characters"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .optional({ checkFalsy: true })
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9\s()-]{8,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("studentNumber")
    .trim()
    .notEmpty()
    .withMessage("Student number is required")
    .isLength({ min: 2, max: 30 })
    .withMessage("Student number must be between 2 and 30 characters")
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage(
      "Student number can only contain letters, numbers and hyphens"
    ),


  body("dateOfBirth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  body("gender")
    .optional({ checkFalsy: true })
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),

  body("address")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Address cannot exceed 300 characters"),

  body("class")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid class ID"),


  body("enrollmentDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Enrollment date must be a valid date"),

  body("status")
    .optional()
    .isIn(["active", "graduated", "transferred", "inactive"])
    .withMessage("Invalid student status"),
];

const updateStudentValidator = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[A-Za-zÀ-ÿ\s'-]+$/)
    .withMessage("First name contains invalid characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[A-Za-zÀ-ÿ\s'-]+$/)
    .withMessage("Last name contains invalid characters"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .optional({ checkFalsy: true })
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9\s()-]{8,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("studentNumber")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Student number must be between 2 and 30 characters")
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage(
      "Student number can only contain letters, numbers and hyphens"
    ),

  body("dateOfBirth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  body("gender")
    .optional({ checkFalsy: true })
    .isIn(["male", "female"])
    .withMessage("Gender must be male or female"),

  body("address")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Address cannot exceed 300 characters"),

  body("class")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid class ID"),


  body("enrollmentDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Enrollment date must be a valid date"),

  body("status")
    .optional()
    .isIn(["active", "graduated", "transferred", "inactive"])
    .withMessage("Invalid student status"),
];

module.exports = {
  createStudentValidator,
  updateStudentValidator,
};