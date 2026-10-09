
const mongoose = require("mongoose");

const Class = require("../models/Class");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Student = require("../models/Student");

const levelsRequiringSection = ["2eme", "3eme", "4eme"];

const allowedFields = [
  "name",
  "level",
  "section",
  "academicYear",
  "teachers",
  "capacity",
];

// Keep only permitted fields from the request body
const pickAllowedFields = (body) => {
  const data = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  return data;
};

// Validate level and section
const validateLevelAndSection = (level, section) => {
  if (levelsRequiringSection.includes(level) && !section) {
    return "Section is required for 2eme, 3eme and 4eme";
  }

  return null;
};

// Validate teacher and subject references
const validateReferences = async (data) => {
  if (data.teachers !== undefined) {
    if (!Array.isArray(data.teachers)) {
      return "Teachers must be an array";
    }

    for (const assignment of data.teachers) {
      if (
        !assignment ||
        !mongoose.isValidObjectId(assignment.teacher) ||
        !mongoose.isValidObjectId(assignment.subject)
      ) {
        return "Each teacher assignment must contain valid teacher and subject IDs";
      }

      const teacherExists = await Teacher.exists({
        _id: assignment.teacher,
      });

      if (!teacherExists) {
        return `Teacher not found: ${assignment.teacher}`;
      }

      const subjectExists = await Subject.exists({
        _id: assignment.subject,
      });

      if (!subjectExists) {
        return `Subject not found: ${assignment.subject}`;
      }
    }
  }

  return null;
};

// CREATE CLASS
const createClass = async (req, res) => {
  try {
    const data = pickAllowedFields(req.body);

    const sectionError = validateLevelAndSection(
      data.level,
      data.section
    );

    if (sectionError) {
      return res.status(400).json({
        success: false,
        message: sectionError,
      });
    }

    const referenceError = await validateReferences(data);

    if (referenceError) {
      return res.status(400).json({
        success: false,
        message: referenceError,
      });
    }

    const classData = await Class.create(data);

    const newClass = await Class.findById(classData._id)
      .populate("teachers.teacher")
      .populate("teachers.subject");

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A class with this unique value already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create class",
      error: error.message,
    });
  }
};

// GET ALL CLASSES
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("teachers.teacher")
      .populate("teachers.subject")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve classes",
      error: error.message,
    });
  }
};

// GET CLASS BY ID
const getClassById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(req.params.id)
      .populate("teachers.teacher")
      .populate("teachers.subject");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Populate students through Student.class if Class.students
    // is configured as a virtual in your Class model.
    await classData.populate("students");

    return res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve class",
      error: error.message,
    });
  }
};

// UPDATE CLASS
const updateClass = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const existingClass = await Class.findById(req.params.id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const data = pickAllowedFields(req.body);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Validate the final level/section combination.
    const finalLevel = data.level ?? existingClass.level;

    const finalSection = Object.prototype.hasOwnProperty.call(
      data,
      "section"
    )
      ? data.section
      : existingClass.section;

    const sectionError = validateLevelAndSection(
      finalLevel,
      finalSection
    );

    if (sectionError) {
      return res.status(400).json({
        success: false,
        message: sectionError,
      });
    }

    const referenceError = await validateReferences(data);

    if (referenceError) {
      return res.status(400).json({
        success: false,
        message: referenceError,
      });
    }

    Object.assign(existingClass, data);

    await existingClass.save();

    const updatedClass = await Class.findById(existingClass._id)
      .populate("teachers.teacher")
      .populate("teachers.subject");

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A class with this unique value already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update class",
      error: error.message,
    });
  }
};

// DELETE CLASS
const deleteClass = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Prevent deletion if students are assigned to this class.
    const assignedStudents = await Student.exists({
      class: classData._id,
    });

    if (assignedStudents) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this class because students are assigned to it",
      });
    }

    await Class.findByIdAndDelete(classData._id);

    return res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete class",
      error: error.message,
    });
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
};
