const { body, param } = require("express-validator");
const validate = require("../middleware/validation.middleware");

const createStaffValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("role")
    .optional()
    .isIn([
      "admin",
      "director",
      "secretary",
      "academic_administrator",
      "administrative_staff",
    ])
    .withMessage("Invalid staff role"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),

  validate,
];

const updateStaffValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid staff ID"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("role")
    .optional()
    .isIn([
      "admin",
      "director",
      "secretary",
      "academic_administrator",
      "administrative_staff",
    ])
    .withMessage("Invalid staff role"),

  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),

  validate,
];

const updateStaffStatusValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid staff ID"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),

  validate,
];

module.exports = {
  createStaffValidator,
  updateStaffValidator,
  updateStaffStatusValidator,
};
