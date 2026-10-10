
const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// Return validation errors before the controller executes
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

// Validate MongoDB ObjectId parameters
const validateId = (field) =>
  param(field)
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`Invalid ${field} ID`);

// Validate required fields for creation
const createClassSubjectValidator = [
  body("class")
    .notEmpty()
    .withMessage("Class ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid class ID"),

  body("subject")
    .notEmpty()
    .withMessage("Subject ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid subject ID"),

  body("teacher")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  body("coefficient")
    .optional()
    .custom((value) =>
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value)) &&
      Number(value) > 0
    )
    .withMessage("Coefficient must be a positive number"),

  validateRequest,
];

// Validate fields for updating
const updateClassSubjectValidator = [
  body().custom((value) => {
    const allowedFields = [
      "class",
      "subject",
      "teacher",
      "coefficient",
    ];

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      !Object.keys(value).some((key) => allowedFields.includes(key))
    ) {
      throw new Error("Provide at least one valid field to update");
    }

    if (Object.keys(value).some((key) => !allowedFields.includes(key))) {
      throw new Error("Request contains unsupported fields");
    }

    return true;
  }),

  body("class")
    .optional()
    .isMongoId()
    .withMessage("Invalid class ID"),

  body("subject")
    .optional()
    .isMongoId()
    .withMessage("Invalid subject ID"),

  body("teacher")
    .optional()
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  body("coefficient")
    .optional()
    .custom((value) =>
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value)) &&
      Number(value) > 0
    )
    .withMessage("Coefficient must be a positive number"),

  validateRequest,
];

// Validate IDs in URL parameters
const classSubjectIdValidator = [
  validateId("id"),
  validateRequest,
];

const classIdValidator = [
  validateId("classId"),
  validateRequest,
];

const teacherIdValidator = [
  validateId("teacherId"),
  validateRequest,
];

module.exports = {
  createClassSubjectValidator,
  updateClassSubjectValidator,
  classSubjectIdValidator,
  classIdValidator,
  teacherIdValidator,
};
