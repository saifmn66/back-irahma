const express = require("express");
const router = express.Router();

const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

const {
  createClassValidator,
  updateClassValidator,
  validateClassId,
} = require("../validators/class.validator");

// POST /api/classes
router.post("/", createClassValidator, createClass);

// GET /api/classes
router.get("/", getAllClasses);

// GET /api/classes/:id
router.get("/:id", validateClassId, getClassById);

// PUT /api/classes/:id
router.put("/:id", updateClassValidator, updateClass);

// DELETE /api/classes/:id
router.delete("/:id", validateClassId, deleteClass);

module.exports = router;
