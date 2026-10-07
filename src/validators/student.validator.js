const { body } = require("express-validator");

const createStudentValidator = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

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

  body("school")
    .notEmpty()
    .withMessage("School is required")
    .isMongoId()
    .withMessage("Invalid school ID"),

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

  body("parents")
    .optional()
    .isArray()
    .withMessage("Parents must be an array"),

  body("parents.*")
    .optional()
    .isMongoId()
    .withMessage("Each parent ID must be a valid MongoDB ID"),

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
  body("studentNumber")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Student number must be between 2 and 30 characters")
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage(
      "Student number can only contain letters, numbers and hyphens"
    ),

  body("school")
    .optional()
    .isMongoId()
    .withMessage("Invalid school ID"),

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

  body("parents")
    .optional()
    .isArray()
    .withMessage("Parents must be an array"),

  body("parents.*")
    .optional()
    .isMongoId()
    .withMessage("Each parent ID must be a valid MongoDB ID"),

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