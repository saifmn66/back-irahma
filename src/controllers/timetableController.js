
const Timetable = require("../models/Timetable");
const Class = require("../models/Class");
const ClassSubject = require("../models/ClassSubject");

// Populate timetable relationships
const populateTimetable = (query) =>
  query
    .populate("class")
    .populate({
      path: "classSubject",
      populate: [
        { path: "subject" },
        { path: "teacher" },
      ],
    });

// Check time overlap: [startTime, endTime)
const hasTimeOverlap = (startA, endA, startB, endB) =>
  startA < endB && startB < endA;

// Find conflicting timetable entries
const findConflicts = async ({
  classId,
  classSubjectId,
  day,
  startTime,
  endTime,
  excludeId,
}) => {
  const assignment = await ClassSubject.findById(classSubjectId);

  if (!assignment) {
    return {
      error: { status: 404, message: "ClassSubject not found" },
    };
  }

  if (String(assignment.class) !== String(classId)) {
    return {
      error: {
        status: 400,
        message: "The ClassSubject does not belong to this class",
      },
    };
  }

  const query = { day };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingSlots = await Timetable.find(query)
    .populate("classSubject");

  for (const slot of existingSlots) {
    if (
      !hasTimeOverlap(
        startTime,
        endTime,
        slot.startTime,
        slot.endTime
      )
    ) {
      continue;
    }

    // A class cannot have two lessons at the same time.
    if (String(slot.class) === String(classId)) {
      return {
        error: {
          status: 409,
          message: "This class already has a lesson during this time",
          conflictId: slot._id,
        },
      };
    }

    // A teacher cannot teach two classes at the same time.
    const existingTeacherId = slot.classSubject?.teacher;
    const newTeacherId = assignment.teacher;

    if (
      existingTeacherId &&
      String(existingTeacherId) === String(newTeacherId)
    ) {
      return {
        error: {
          status: 409,
          message: "This teacher already has a lesson during this time",
          conflictId: slot._id,
        },
      };
    }
  }

  return { assignment };
};

// Create timetable slot
exports.createTimetable = async (req, res) => {
  try {
    const {
      class: classId,
      classSubject: classSubjectId,
      day,
      startTime,
      endTime,
      room,
    } = req.body;

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "endTime must be later than startTime",
      });
    }

    const existingClass = await Class.findById(classId);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const result = await findConflicts({
      classId,
      classSubjectId,
      day,
      startTime,
      endTime,
    });

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        ...result.error,
      });
    }

    const timetable = await Timetable.create({
      class: classId,
      classSubject: classSubjectId,
      day,
      startTime,
      endTime,
      room,
    });

    const populatedTimetable = await populateTimetable(
      Timetable.findById(timetable._id)
    );

    return res.status(201).json({
      success: true,
      message: "Timetable slot created successfully",
      data: populatedTimetable,
    });
  } catch (error) {
    console.error("Create timetable error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create timetable slot",
      error: error.message,
    });
  }
};

// Get all timetable slots
exports.getAllTimetables = async (req, res) => {
  try {
    const { classId, teacherId, day } = req.query;
    const filter = {};

    if (classId) filter.class = classId;
    if (day) filter.day = day;

    let timetables = await populateTimetable(
      Timetable.find(filter).sort({ day: 1, startTime: 1 })
    );

    timetables = await timetables;

    if (teacherId) {
      timetables = timetables.filter(
        (slot) =>
          String(slot.classSubject?.teacher?._id) === String(teacherId)
      );
    }

    return res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
    });
  } catch (error) {
    console.error("Get timetables error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve timetable slots",
      error: error.message,
    });
  }
};

// Get timetable slot by ID
exports.getTimetableById = async (req, res) => {
  try {
    const timetable = await populateTimetable(
      Timetable.findById(req.params.id)
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable slot not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Get timetable by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve timetable slot",
      error: error.message,
    });
  }
};

// Get timetable for one class
exports.getTimetableByClass = async (req, res) => {
  try {
    const timetables = await populateTimetable(
      Timetable.find({ class: req.params.classId }).sort({
        day: 1,
        startTime: 1,
      })
    );

    return res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables,
    });
  } catch (error) {
    console.error("Get timetable by class error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve class timetable",
      error: error.message,
    });
  }
};

// Update timetable slot
exports.updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable slot not found",
      });
    }

    const allowedFields = [
      "class",
      "classSubject",
      "day",
      "startTime",
      "endTime",
      "room",
    ];

    const invalidFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Unknown field(s)",
        fields: invalidFields,
      });
    }

    const updates = { ...req.body };

    const nextClassId = updates.class ?? String(timetable.class);
    const nextClassSubjectId =
      updates.classSubject ?? String(timetable.classSubject);
    const nextDay = updates.day ?? timetable.day;
    const nextStartTime = updates.startTime ?? timetable.startTime;
    const nextEndTime = updates.endTime ?? timetable.endTime;

    if (nextStartTime >= nextEndTime) {
      return res.status(400).json({
        success: false,
        message: "endTime must be later than startTime",
      });
    }

    const existingClass = await Class.findById(nextClassId);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const result = await findConflicts({
      classId: nextClassId,
      classSubjectId: nextClassSubjectId,
      day: nextDay,
      startTime: nextStartTime,
      endTime: nextEndTime,
      excludeId: timetable._id,
    });

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        ...result.error,
      });
    }

    Object.assign(timetable, updates);
    await timetable.save();

    const updatedTimetable = await populateTimetable(
      Timetable.findById(timetable._id)
    );

    return res.status(200).json({
      success: true,
      message: "Timetable slot updated successfully",
      data: updatedTimetable,
    });
  } catch (error) {
    console.error("Update timetable error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update timetable slot",
      error: error.message,
    });
  }
};

// Delete timetable slot
exports.deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable slot not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Timetable slot deleted successfully",
    });
  } catch (error) {
    console.error("Delete timetable error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete timetable slot",
      error: error.message,
    });
  }
};
