const express = require("express");
const router = express.Router();

const {
  createAttendance,
  getAllAttendance,
  getAttendanceById,
  getAttendanceByClass,
  getAttendanceByTeacher,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendance.controller");

const {
  createAttendanceValidator,
  updateAttendanceValidator,
  attendanceIdValidator,
  attendanceClassIdValidator,
  attendanceTeacherIdValidator,
  attendanceDateQueryValidator,
} = require("../validators/attendance.validator");

// Create attendance
router.post("/", createAttendanceValidator, createAttendance);

// Get all attendance records
router.get("/", getAllAttendance);

// Get attendance records for a class, optionally filtered by date
router.get(
  "/class/:classId",
  attendanceClassIdValidator,
  attendanceDateQueryValidator,
  getAttendanceByClass,
);

// Get attendance records for a teacher
router.get(
  "/teacher/:teacherId",
  attendanceTeacherIdValidator,
  getAttendanceByTeacher,
);

// Get one attendance record
router.get("/:id", attendanceIdValidator, getAttendanceById);

// Update attendance
router.put(
  "/:id",
  attendanceIdValidator,
  updateAttendanceValidator,
  updateAttendance,
);

// Delete attendance
router.delete("/:id", attendanceIdValidator, deleteAttendance);

module.exports = router;
