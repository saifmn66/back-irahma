
const express = require("express");
const router = express.Router();

const timetableController = require("../controllers/timetableController");

const {
  validateCreateTimetable,
  validateUpdateTimetable,
  validateTimetableId,
  validateClassId,
  validateTimetableQuery,
} = require("../validators/timetable.validator");

// Create timetable slot
router.post(
  "/",
  validateCreateTimetable,
  timetableController.createTimetable
);

// Get all slots; optional filters: classId, teacherId, day
router.get(
  "/",
  validateTimetableQuery,
  timetableController.getAllTimetables
);

// Get timetable for a class
router.get(
  "/class/:classId",
  validateClassId,
  timetableController.getTimetableByClass
);

// Get one timetable slot
router.get(
  "/:id",
  validateTimetableId,
  timetableController.getTimetableById
);

// Update timetable slot
router.put(
  "/:id",
  validateUpdateTimetable,
  timetableController.updateTimetable
);

// Delete timetable slot
router.delete(
  "/:id",
  validateTimetableId,
  timetableController.deleteTimetable
);

module.exports = router;
I