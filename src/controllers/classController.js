const mongoose = require("mongoose");
const Class = require("../models/Class");

// =====================================================
// CREATE CLASS
// =====================================================
const createClass = async (req, res) => {
  try {
    const {
      name,
      level,
      section,
      school,
      academicYear,
      capacity,
    } = req.body;

    if (!name || !level || !school || !academicYear) {
      return res.status(400).json({
        message: "name, level, school and academicYear are required",
      });
    }

    // Section required for 2eme, 3eme and 4eme
    if (["2eme", "3eme", "4eme"].includes(level) && !section) {
      return res.status(400).json({
        message: `section is required for ${level}`,
      });
    }

    // Validate 2eme sections
    if (
      level === "2eme" &&
      ![
        "lettres",
        "science",
        "informatique",
        "economie_gestion",
      ].includes(section)
    ) {
      return res.status(400).json({
        message: "Invalid section for 2eme",
      });
    }

    // Validate 3eme / 4eme sections
    if (
      ["3eme", "4eme"].includes(level) &&
      ![
        "lettres",
        "science",
        "informatique",
        "economie_gestion",
        "technique",
        "math",
      ].includes(section)
    ) {
      return res.status(400).json({
        message: `Invalid section for ${level}`,
      });
    }

    // Do not allow sections for 7eme - 1ere
    if (
      ["7eme", "8eme", "9eme", "1ere"].includes(level) &&
      section
    ) {
      return res.status(400).json({
        message: `section is not allowed for ${level}`,
      });
    }

    // Check duplicate class
    const existingClass = await Class.findOne({
      name,
      school,
      academicYear,
    });

    if (existingClass) {
      return res.status(409).json({
        message: "This class already exists for this academic year",
      });
    }

    const newClass = await Class.create({
      name,
      level,
      section,
      school,
      academicYear,
      capacity,
    });

    const populatedClass = await Class.findById(newClass._id)
      .populate("school", "name")
      .populate("students", "firstName lastName email")
      .populate("teachers.teacher", "firstName lastName email")
      .populate("teachers.subject", "name");

    return res.status(201).json({
      message: "Class created successfully",
      class: populatedClass,
    });
  } catch (error) {
    console.error("Create class error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL CLASSES
// =====================================================
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("school", "name")
      .populate("students", "firstName lastName email")
      .populate("teachers.teacher", "firstName lastName email")
      .populate("teachers.subject", "name")
      .sort({ level: 1, name: 1 });

    return res.status(200).json({
      count: classes.length,
      classes,
    });
  } catch (error) {
    console.error("Get all classes error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET CLASS BY ID
// =====================================================
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(id)
      .populate("school", "name")
      .populate("students", "firstName lastName email")
      .populate("teachers.teacher", "firstName lastName email")
      .populate("teachers.subject", "name");

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    return res.status(200).json({
      class: classData,
    });
  } catch (error) {
    console.error("Get class error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE CLASS
// =====================================================
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    const {
      name,
      level,
      section,
      school,
      academicYear,
      capacity,
    } = req.body;

    const newLevel = level || classData.level;
    const newSection =
      section !== undefined ? section : classData.section;

    // ==========================================
    // Validate section
    // ==========================================

    if (
      ["2eme", "3eme", "4eme"].includes(newLevel) &&
      !newSection
    ) {
      return res.status(400).json({
        message: `section is required for ${newLevel}`,
      });
    }

    if (
      newLevel === "2eme" &&
      ![
        "lettres",
        "science",
        "informatique",
        "economie_gestion",
      ].includes(newSection)
    ) {
      return res.status(400).json({
        message: "Invalid section for 2eme",
      });
    }

    if (
      ["3eme", "4eme"].includes(newLevel) &&
      ![
        "lettres",
        "science",
        "informatique",
        "economie_gestion",
        "technique",
        "math",
      ].includes(newSection)
    ) {
      return res.status(400).json({
        message: `Invalid section for ${newLevel}`,
      });
    }

    // Sections not allowed for 7eme - 1ere
    if (
      ["7eme", "8eme", "9eme", "1ere"].includes(newLevel)
    ) {
      classData.section = undefined;
    } else {
      classData.section = newSection;
    }

    // ==========================================
    // Update fields
    // ==========================================

    if (name !== undefined) {
      classData.name = name;
    }

    if (level !== undefined) {
      classData.level = level;
    }

    if (school !== undefined) {
      classData.school = school;
    }

    if (academicYear !== undefined) {
      classData.academicYear = academicYear;
    }

    if (capacity !== undefined) {
      classData.capacity = capacity;
    }

    await classData.save();

    const updatedClass = await Class.findById(id)
      .populate("school", "name")
      .populate("students", "firstName lastName email")
      .populate("teachers.teacher", "firstName lastName email")
      .populate("teachers.subject", "name");

    return res.status(200).json({
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Update class error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE CLASS
// =====================================================
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    await Class.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Delete class error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// ADD STUDENT TO CLASS
// =====================================================
const addStudentToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        message: "studentId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    // Check capacity
    if (classData.students.length >= classData.capacity) {
      return res.status(400).json({
        message: "Class capacity has been reached",
      });
    }

    // Check duplicate student
    const alreadyExists = classData.students.some(
      (student) => student.toString() === studentId,
    );

    if (alreadyExists) {
      return res.status(400).json({
        message: "Student is already in this class",
      });
    }

    classData.students.push(studentId);

    await classData.save();

    const updatedClass = await Class.findById(id)
      .populate("students", "firstName lastName email");

    return res.status(200).json({
      message: "Student added to class successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Add student error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// REMOVE STUDENT FROM CLASS
// =====================================================
const removeStudentFromClass = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    const studentExists = classData.students.some(
      (student) => student.toString() === studentId,
    );

    if (!studentExists) {
      return res.status(404).json({
        message: "Student is not in this class",
      });
    }

    classData.students = classData.students.filter(
      (student) => student.toString() !== studentId,
    );

    await classData.save();

    return res.status(200).json({
      message: "Student removed from class successfully",
    });
  } catch (error) {
    console.error("Remove student error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// ADD TEACHER TO CLASS
// =====================================================
const addTeacherToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, subjectId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    if (!teacherId || !subjectId) {
      return res.status(400).json({
        message: "teacherId and subjectId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        message: "Invalid teacher ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        message: "Invalid subject ID",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    // Prevent same teacher + same subject assignment
    const alreadyAssigned = classData.teachers.some(
      (item) =>
        item.teacher.toString() === teacherId &&
        item.subject.toString() === subjectId,
    );

    if (alreadyAssigned) {
      return res.status(400).json({
        message: "This teacher is already assigned to this subject",
      });
    }

    classData.teachers.push({
      teacher: teacherId,
      subject: subjectId,
    });

    await classData.save();

    const updatedClass = await Class.findById(id)
      .populate("teachers.teacher", "firstName lastName email")
      .populate("teachers.subject", "name");

    return res.status(200).json({
      message: "Teacher assigned to class successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Add teacher error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// REMOVE TEACHER FROM CLASS
// =====================================================
const removeTeacherFromClass = async (req, res) => {
  try {
    const { id, teacherId, subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        message: "Invalid teacher ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        message: "Invalid subject ID",
      });
    }

    const classData = await Class.findById(id);

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    const originalLength = classData.teachers.length;

    classData.teachers = classData.teachers.filter(
      (item) =>
        !(
          item.teacher.toString() === teacherId &&
          item.subject.toString() === subjectId
        ),
    );

    if (classData.teachers.length === originalLength) {
      return res.status(404).json({
        message: "Teacher assignment not found",
      });
    }

    await classData.save();

    return res.status(200).json({
      message: "Teacher removed from class successfully",
    });
  } catch (error) {
    console.error("Remove teacher error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET CLASS TEACHERS
// =====================================================
const getClassTeachers = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(id)
      .populate("teachers.teacher", "firstName lastName email")
      .populate("teachers.subject", "name");

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    return res.status(200).json({
      count: classData.teachers.length,
      teachers: classData.teachers,
    });
  } catch (error) {
    console.error("Get class teachers error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET CLASS STUDENTS
// =====================================================
const getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid class ID",
      });
    }

    const classData = await Class.findById(id).populate(
      "students",
      "firstName lastName email",
    );

    if (!classData) {
      return res.status(404).json({
        message: "Class not found",
      });
    }

    return res.status(200).json({
      count: classData.students.length,
      capacity: classData.capacity,
      students: classData.students,
    });
  } catch (error) {
    console.error("Get class students error:", error);

    return res.status(500).json({
      message: "Server error",
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

  addStudentToClass,
  removeStudentFromClass,
  getClassStudents,

  addTeacherToClass,
  removeTeacherFromClass,
  getClassTeachers,
};