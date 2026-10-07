const { body } = require("express-validator");

const createTeacherValidator = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("teacherNumber")
    .trim()
    .notEmpty()
    .withMessage("Teacher number is required")
    .isLength({ min: 2, max: 30 })
    .withMessage("Teacher number must be between 2 and 30 characters")
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage(
      "Teacher number can only contain letters, numbers and hyphens"
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

  body("specialization")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Specialization must be between 2 and 100 characters"
    ),

  body("hireDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Hire date must be a valid date"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "on_leave", "retired"])
    .withMessage("Invalid teacher status"),
];

const updateTeacherValidator = [
  body("teacherNumber")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Teacher number must be between 2 and 30 characters")
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage(
      "Teacher number can only contain letters, numbers and hyphens"
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

  body("specialization")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Specialization must be between 2 and 100 characters"
    ),

  body("hireDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Hire date must be a valid date"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "on_leave", "retired"])
    .withMessage("Invalid teacher status"),
];

module.exports = {
  createTeacherValidator,
  updateTeacherValidator,
};