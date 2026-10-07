const express = require("express");

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

const {
  createStudentValidator,
  updateStudentValidator,
} = require("../validators/student.validator");

const validate = require("../middleware/validation.middleware");

const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// All student routes require authentication
router.use(protect);

// Create student
router.post("/", createStudentValidator, validate, createStudent);

// Get all students
router.get("/", getStudents);

// Get student by ID
router.get("/:id", getStudentById);

// Update student
router.put("/:id", updateStudentValidator, validate, updateStudent);

// Delete student
router.delete("/:id", deleteStudent);

module.exports = router;
