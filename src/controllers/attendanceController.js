
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Class = require("../models/Class");
const ClassSubject = require("../models/ClassSubject");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

const populateAttendance = (query) =>
  query
    .populate("class")
    .populate("classSubject")
    .populate("teacher")
    .populate("students.student");

// Check that every submitted student belongs to the class
const validateStudentsInClass = async (students, classId) => {
  const studentIds = students.map((item) => String(item.student));
  const uniqueIds = new Set(studentIds);

  if (uniqueIds.size !== studentIds.length) {
    return {
      valid: false,
      message: "A student cannot appear more than once in an attendance record",
    };
  }

  const count = await Student.countDocuments({
    _id: { $in: studentIds },
    class: classId,
  });

  if (count !== uniqueIds.size) {
    return {
      valid: false,
      message: "One or more students do not belong to this class",
    };
  }

  return { valid: true };
};

// CREATE ATTENDANCE
const createAttendance = async (req, res) => {
  try {
    const {
      class: classId,
      classSubject: classSubjectId,
      teacher: teacherId,
      date,
      startTime,
      endTime,
      students,
    } = req.body;

    const [existingClass, assignment, existingTeacher] =
      await Promise.all([
        Class.findById(classId),
        ClassSubject.findById(classSubjectId),
        Teacher.findById(teacherId),
      ]);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Class subject assignment not found",
      });
    }

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Ensure assignment, class and teacher match
    if (
      String(assignment.class) !== String(classId) ||
      String(assignment.teacher) !== String(teacherId)
    ) {
      return res.status(400).json({
        success: false,
        message: "The class, subject assignment, and teacher do not match",
      });
    }

    const studentCheck = await validateStudentsInClass(
      students,
      classId
    );

    if (!studentCheck.valid) {
      return res.status(400).json({
        success: false,
        message: studentCheck.message,
      });
    }

    // Prevent duplicate attendance for the same lesson and time
    const duplicate = await Attendance.findOne({
      classSubject: classSubjectId,
      date: new Date(date),
      startTime,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this lesson and time",
      });
    }

    const attendance = await Attendance.create({
      class: classId,
      classSubject: classSubjectId,
      teacher: teacherId,
      date,
      startTime,
      endTime,
      students,
    });

    const data = await populateAttendance(
      Attendance.findById(attendance._id)
    );

    return res.status(201).json({
      success: true,
      message: "Attendance created successfully",
      data,
    });
  } catch (error) {
    console.error("Create attendance:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ALL ATTENDANCE RECORDS
const getAllAttendance = async (req, res) => {
  try {
    const data = await populateAttendance(
      Attendance.find()
    ).sort({ date: -1, startTime: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get attendance:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ATTENDANCE BY ID
const getAttendanceById = async (req, res) => {
  try {
    const data = await populateAttendance(
      Attendance.findById(req.params.id)
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get attendance by ID:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ATTENDANCE BY CLASS
const getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const existingClass = await Class.findById(classId);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const filter = { class: classId };

    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = {
        $gte: date,
        $lt: nextDay,
      };
    }

    const data = await populateAttendance(
      Attendance.find(filter)
    ).sort({ date: -1, startTime: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get attendance by class:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ATTENDANCE BY TEACHER
const getAttendanceByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const existingTeacher = await Teacher.findById(teacherId);

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const data = await populateAttendance(
      Attendance.find({ teacher: teacherId })
    ).sort({ date: -1, startTime: -1 });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get attendance by teacher:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE ATTENDANCE
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const {
      class: classId,
      classSubject: classSubjectId,
      teacher: teacherId,
      date,
      startTime,
      endTime,
      students,
    } = req.body;

    const newClassId = classId ?? attendance.class;
    const newAssignmentId =
      classSubjectId ?? attendance.classSubject;
    const newTeacherId = teacherId ?? attendance.teacher;

    // Check that the final class, assignment and teacher are consistent
    const [existingClass, assignment, existingTeacher] =
      await Promise.all([
        Class.findById(newClassId),
        ClassSubject.findById(newAssignmentId),
        Teacher.findById(newTeacherId),
      ]);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Class subject assignment not found",
      });
    }

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    if (
      String(assignment.class) !== String(newClassId) ||
      String(assignment.teacher) !== String(newTeacherId)
    ) {
      return res.status(400).json({
        success: false,
        message: "The class, subject assignment, and teacher do not match",
      });
    }

    const newStudents = students ?? attendance.students;

    const studentCheck = await validateStudentsInClass(
      newStudents,
      newClassId
    );

    if (!studentCheck.valid) {
      return res.status(400).json({
        success: false,
        message: studentCheck.message,
      });
    }

    const newDate = date ?? attendance.date;
    const newStartTime = startTime ?? attendance.startTime;

    const duplicate = await Attendance.findOne({
      _id: { $ne: id },
      classSubject: newAssignmentId,
      date: new Date(newDate),
      startTime: newStartTime,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this lesson and time",
      });
    }

    if (classId !== undefined) attendance.class = classId;
    if (classSubjectId !== undefined) {
      attendance.classSubject = classSubjectId;
    }
    if (teacherId !== undefined) attendance.teacher = teacherId;
    if (date !== undefined) attendance.date = date;
    if (startTime !== undefined) attendance.startTime = startTime;
    if (endTime !== undefined) attendance.endTime = endTime;
    if (students !== undefined) attendance.students = students;

    await attendance.save();

    const data = await populateAttendance(
      Attendance.findById(id)
    );

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update attendance:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE ATTENDANCE
const deleteAttendance = async (req, res) => {
  try {
    const data = await Attendance.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    console.error("Delete attendance:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createAttendance,
  getAllAttendance,
  getAttendanceById,
  getAttendanceByClass,
  getAttendanceByTeacher,
  updateAttendance,
  deleteAttendance,
};
