const express = require("express");

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getAllActiveStudentsNumber,
} = require("../controllers/studentController");

const {
  createStudentValidator,
  updateStudentValidator,
} = require("../validators/student.validator");

const validate = require("../middleware/validation.middleware");

const router = express.Router();

// Create student
router.post("/create", createStudentValidator, validate, createStudent);

// Get all students
router.get("/", getStudents);

// Get active students count — MUST be before /:id
router.get("/count-active", getAllActiveStudentsNumber);

// Get student by ID
router.get("/:id", getStudentById);

// Update student
router.put("/:id", updateStudentValidator, validate, updateStudent);

// Delete student
router.delete("/:id", deleteStudent);

module.exports = router;
