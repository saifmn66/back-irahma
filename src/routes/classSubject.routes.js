const express = require("express");
const router = express.Router();

const {
  createClassSubject,
  getAllClassSubjects,
  getClassSubjectById,
  getSubjectsByClass,
  getClassesByTeacher,
  updateClassSubject,
  deleteClassSubject,
} = require("../controllers/classSubject.controller");

const {
  createClassSubjectValidator,
  updateClassSubjectValidator,
  classSubjectIdValidator,
  classIdValidator,
  teacherIdValidator,
} = require("../validators/classSubject.validator");

// Create a class-subject assignment
router.post("/", createClassSubjectValidator, createClassSubject);

// Get all assignments
router.get("/", getAllClassSubjects);

// Get assignments for a class
router.get("/class/:classId", classIdValidator, getSubjectsByClass);

// Get assignments for a teacher
router.get("/teacher/:teacherId", teacherIdValidator, getClassesByTeacher);

// Get one assignment
router.get("/:id", classSubjectIdValidator, getClassSubjectById);

// Update an assignment
router.put(
  "/:id",
  classSubjectIdValidator,
  updateClassSubjectValidator,
  updateClassSubject,
);

// Delete an assignment
router.delete("/:id", classSubjectIdValidator, deleteClassSubject);

module.exports = router;
