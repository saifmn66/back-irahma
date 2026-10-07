const { body } = require("express-validator");

const createUserValidator = [
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
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9\s()-]{8,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn([
      "student",
      "parent",
      "teacher",
      "admin",
      "school_admin",
    ])
    .withMessage("Invalid user role"),

  body("avatar")
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Avatar must be a valid URL"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const updateUserValidator = [
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
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),

  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9\s()-]{8,20}$/)
    .withMessage("Please provide a valid phone number"),

  body("role")
    .optional()
    .isIn([
      "student",
      "parent",
      "teacher",
      "admin",
      "school_admin",
    ])
    .withMessage("Invalid user role"),

  body("avatar")
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Avatar must be a valid URL"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

module.exports = {
  createUserValidator,
  updateUserValidator,
};