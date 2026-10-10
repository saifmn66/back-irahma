const express = require("express");
const router = express.Router();

const {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

const {
  validateSubjectId,
  createSubjectValidator,
  updateSubjectValidator,
} = require("../validators/subject.validator");

router.post("/", createSubjectValidator, createSubject);

router.get("/", getAllSubjects);

router.get("/:id", validateSubjectId, getSubjectById);

router.put("/:id", validateSubjectId, updateSubjectValidator, updateSubject);

router.delete("/:id", validateSubjectId, deleteSubject);

module.exports = router;
