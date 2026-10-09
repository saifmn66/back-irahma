
const { body, param, validationResult } = require("express-validator");

const levels = [
  "7eme",
  "8eme",
  "9eme",
  "1ere",
  "2eme",
  "3eme",
  "4eme",
];

const sections = [
  "lettres",
  "science",
  "informatique",
  "economie_gestion",
  "technique",
  "math",
];

// Validate request data
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

// Validate MongoDB IDs
const validateClassId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid class ID"),
  validateRequest,
];

// Create class validation
const createClassValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ max: 100 })
    .withMessage("Class name cannot exceed 100 characters"),

  body("level")
    .notEmpty()
    .withMessage("Level is required")
    .isIn(levels)
    .withMessage("Invalid class level"),

  body("section")
    .custom((value, { req }) => {
      const needsSection = ["2eme", "3eme", "4eme"].includes(
        req.body.level
      );

      if (needsSection && !value) {
        throw new Error("Section is required for 2eme, 3eme and 4eme");
      }

      if (value && !sections.includes(value)) {
        throw new Error("Invalid section");
      }

      return true;
    }),


  body("academicYear")
    .trim()
    .notEmpty()
    .withMessage("Academic year is required")
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Academic year must use the format YYYY-YYYY"),

  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),

  body("teachers")
    .optional()
    .isArray()
    .withMessage("Teachers must be an array"),

  body("teachers.*.teacher")
    .if(body("teachers").isArray())
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  body("teachers.*.subject")
    .if(body("teachers").isArray())
    .notEmpty()
    .withMessage("Subject ID is required")
    .isMongoId()
    .withMessage("Invalid subject ID"),

  validateRequest,
];

// Update class validation
const updateClassValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid class ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Class name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Class name cannot exceed 100 characters"),

  body("level")
    .optional()
    .isIn(levels)
    .withMessage("Invalid class level"),

  body("section")
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !sections.includes(value)) {
        throw new Error("Invalid section");
      }
      return true;
    }),

  body("school")
    .optional()
    .isMongoId()
    .withMessage("Invalid school ID"),

  body("academicYear")
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Academic year must use the format YYYY-YYYY"),

  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),

  body("teachers")
    .optional()
    .isArray()
    .withMessage("Teachers must be an array"),

  body("teachers.*.teacher")
    .if(body("teachers").isArray())
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  body("teachers.*.subject")
    .if(body("teachers").isArray())
    .notEmpty()
    .withMessage("Subject ID is required")
    .isMongoId()
    .withMessage("Invalid subject ID"),

  validateRequest,
];

module.exports = {
  createClassValidator,
  updateClassValidator,
  validateClassId,
};
