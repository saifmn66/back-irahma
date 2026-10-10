
const { body, param, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};

const validateObjectId = (field, source = "body") => {
  const validator =
    source === "param"
      ? param(field)
      : source === "query"
        ? query(field)
        : body(field);

  return validator
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`${field} must be a valid MongoDB ID`);
};

const validateDay = (field = "day", optional = false) => {
  const validator = body(field);

  if (optional) {
    validator.optional();
  } else {
    validator.notEmpty().withMessage("day is required").bail();
  }

  return validator
    .isIn(DAYS)
    .withMessage(`day must be one of: ${DAYS.join(", ")}`);
};

const validateTime = (field, optional = false) => {
  const validator = body(field);

  if (optional) {
    validator.optional();
  } else {
    validator.notEmpty().withMessage(`${field} is required`).bail();
  }

  return validator
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage(`${field} must use HH:mm format, for example 08:30`);
};

// Create timetable slot
exports.validateCreateTimetable = [
  validateObjectId("class"),
  validateObjectId("classSubject"),
  validateDay(),
  validateTime("startTime"),
  validateTime("endTime"),

  body("room")
    .optional({ nullable: true })
    .isString()
    .withMessage("room must be a string")
    .trim()
    .isLength({ max: 50 })
    .withMessage("room cannot exceed 50 characters"),

  body().custom((value) => {
    if (
      value.startTime &&
      value.endTime &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value.startTime) &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value.endTime) &&
      value.startTime >= value.endTime
    ) {
      throw new Error("endTime must be later than startTime");
    }

    return true;
  }),

  validateRequest,
];

// Update timetable slot
exports.validateUpdateTimetable = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid timetable ID"),

  body().custom((value) => {
    const allowedFields = [
      "class",
      "classSubject",
      "day",
      "startTime",
      "endTime",
      "room",
    ];

    const invalidFields = Object.keys(value).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length) {
      throw new Error(`Invalid field(s): ${invalidFields.join(", ")}`);
    }

    if (Object.keys(value).length === 0) {
      throw new Error("At least one field is required for an update");
    }

    return true;
  }),

  body("class")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("class must be a valid MongoDB ID"),

  body("classSubject")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("classSubject must be a valid MongoDB ID"),

  validateDay("day", true),
  validateTime("startTime", true),
  validateTime("endTime", true),

  body("room")
    .optional({ nullable: true })
    .isString()
    .withMessage("room must be a string")
    .trim()
    .isLength({ max: 50 })
    .withMessage("room cannot exceed 50 characters"),

  body().custom((value, { req }) => {
    if (
      value.startTime &&
      value.endTime &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value.startTime) &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value.endTime) &&
      value.startTime >= value.endTime
    ) {
      throw new Error("endTime must be later than startTime");
    }

    return true;
  }),

  validateRequest,
];

// Validate timetable ID in URL
exports.validateTimetableId = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid timetable ID"),
  validateRequest,
];

// Validate class ID in URL
exports.validateClassId = [
  param("classId")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid class ID"),
  validateRequest,
];

// Validate optional query filters
exports.validateTimetableQuery = [
  query("classId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("classId must be a valid MongoDB ID"),

  query("teacherId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("teacherId must be a valid MongoDB ID"),

  query("day")
    .optional()
    .isIn(DAYS)
    .withMessage(`day must be one of: ${DAYS.join(", ")}`),

  validateRequest,
];
