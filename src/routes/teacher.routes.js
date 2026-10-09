const express = require("express");

const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");

const {
  createTeacherValidator,
  updateTeacherValidator,
} = require("../validators/teacher.validator");

const validate = require("../middleware/validation.middleware");

const router = express.Router();

// Create teacher
router.post("/", createTeacherValidator, validate, createTeacher);

// Get all teachers
router.get("/", getTeachers);

// Get teacher by ID
router.get("/:id", getTeacherById);

// Update teacher
router.put("/:id", updateTeacherValidator, validate, updateTeacher);

// Delete teacher
router.delete("/:id", deleteTeacher);

module.exports = router;
