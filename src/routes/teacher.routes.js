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

const { protect } = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const router = express.Router();

// All teacher routes require authentication
router.use(protect);

// Create teacher
router.post(
  "/",
  authorize("teacher"),
  createTeacherValidator,
  validate,
  createTeacher,
);

// Get all teachers
router.get("/", getTeachers);

// Get teacher by ID
router.get("/:id", getTeacherById);

// Update teacher
router.put(
  "/:id",
  authorize("teacher"),
  updateTeacherValidator,
  validate,
  updateTeacher,
);

// Delete teacher
router.delete("/:id", authorize("teacher"), deleteTeacher);

module.exports = router;
