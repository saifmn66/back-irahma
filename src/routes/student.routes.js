const express = require("express");

const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkDeleteStudents,
  getAllActiveStudentsNumber,
  changeStudentClass,
} = require("../controllers/studentController");

const {
  createStudentValidator,
  updateStudentValidator,
  changeClassValidator,
} = require("../validators/student.validator");

const validate = require("../middleware/validation.middleware");

const router = express.Router();

// Create student
router.post("/create", createStudentValidator, validate, createStudent);

// Bulk delete students
router.post("/bulk-delete", bulkDeleteStudents);

// Get all students
router.get("/", getStudents);

// Get active students count — MUST be before /:id
router.get("/count-active", getAllActiveStudentsNumber);

// Get student by ID
router.get("/:id", getStudentById);

// Update student
router.put("/:id", updateStudentValidator, validate, updateStudent);

// Change student from one class to another class
router.put(
  "/:id/change-class",
  changeClassValidator,
  validate,
  changeStudentClass
);
router.patch(
  "/:id/change-class",
  changeClassValidator,
  validate,
  changeStudentClass
);

// Delete student
router.delete("/:id", deleteStudent);

module.exports = router;