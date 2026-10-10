
const { body, param, validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

const validateSubjectId = [
  param("id").isMongoId().withMessage("Invalid subject ID"),
  validateRequest,
];

const createSubjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Subject name is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Subject name cannot exceed 100 characters"),

  body("code")
    .optional()
    .trim()
    .custom((value) => value === "" || value.length <= 20)
    .withMessage("Subject code cannot exceed 20 characters"),

  validateRequest,
];

const updateSubjectValidator = [
  body().custom((value) => {
    const allowedFields = ["name", "code"];

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).length === 0
    ) {
      throw new Error("Provide at least one field to update");
    }

    if (Object.keys(value).some((key) => !allowedFields.includes(key))) {
      throw new Error("Request contains unsupported fields");
    }

    return true;
  }),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Subject name cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Subject name cannot exceed 100 characters"),

  body("code")
    .optional()
    .trim()
    .custom((value) => value === "" || value.length <= 20)
    .withMessage("Subject code cannot exceed 20 characters"),

  validateRequest,
];

module.exports = {
  validateSubjectId,
  createSubjectValidator,
  updateSubjectValidator,
};
