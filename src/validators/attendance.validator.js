
const { body, param, query, validationResult } = require("express-validator");

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

const validateId = (field) =>
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} ID`);

const timeValidator = (field) =>
  body(field)
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage(`${field} must use HH:mm format, e.g. 08:30`);

const dateValidator = (field, optional = false) => {
  const validator = body(field);

  if (optional) {
    validator.optional();
  } else {
    validator.notEmpty().withMessage("Date is required").bail();
  }

  return validator
    .isISO8601({ strict: true })
    .withMessage("Date must be a valid ISO date, e.g. 2026-10-10");
};

const studentArrayValidator = (optional = false) => {
  const validator = body("students");

  if (optional) {
    validator.optional();
  } else {
    validator.notEmpty().withMessage("Students are required").bail();
  }

  return validator
    .isArray({ min: 1 })
    .withMessage("Students must be a non-empty array");
};

const studentItemValidators = [
  body("students.*.student")
    .isMongoId()
    .withMessage("Each student must have a valid student ID"),

  body("students.*.status")
    .optional()
    .isIn(["present", "absent", "late", "excused"])
    .withMessage("Invalid attendance status"),

  body("students.*.note")
    .optional()
    .isString()
    .withMessage("Student note must be a string")
    .trim(),
];

// CREATE
const createAttendanceValidator = [
  body("class")
    .notEmpty()
    .withMessage("Class ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid class ID"),

  body("classSubject")
    .notEmpty()
    .withMessage("ClassSubject ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid ClassSubject ID"),

  body("teacher")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  dateValidator("date"),

  timeValidator("startTime"),
  timeValidator("endTime"),

  studentArrayValidator(),
  ...studentItemValidators,

  validateRequest,
];

// UPDATE
const updateAttendanceValidator = [
  body().custom((value) => {
    const allowedFields = [
      "class",
      "classSubject",
      "teacher",
      "date",
      "startTime",
      "endTime",
      "students",
    ];

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

  body("class")
    .optional()
    .isMongoId()
    .withMessage("Invalid class ID"),

  body("classSubject")
    .optional()
    .isMongoId()
    .withMessage("Invalid ClassSubject ID"),

  body("teacher")
    .optional()
    .isMongoId()
    .withMessage("Invalid teacher ID"),

  dateValidator("date", true),

  timeValidator("startTime").optional(),
  timeValidator("endTime").optional(),

  studentArrayValidator(true),
  ...studentItemValidators,

  validateRequest,
];

// URL PARAMETER VALIDATORS
const attendanceIdValidator = [
  validateId("id"),
  validateRequest,
];

const attendanceClassIdValidator = [
  validateId("classId"),
  validateRequest,
];

const attendanceTeacherIdValidator = [
  validateId("teacherId"),
  validateRequest,
];

// OPTIONAL DATE FILTER: ?date=2026-10-10
const attendanceDateQueryValidator = [
  query("date")
    .optional()
    .isISO8601({ strict: true })
    .withMessage("Query date must be a valid ISO date, e.g. 2026-10-10"),

  validateRequest,
];

module.exports = {
  createAttendanceValidator,
  updateAttendanceValidator,
  attendanceIdValidator,
  attendanceClassIdValidator,
  attendanceTeacherIdValidator,
  attendanceDateQueryValidator,
};
