const Student = require("../models/Student");
const User = require("../models/User");

// Create student
const createStudent = async (req, res) => {
  try {
    const {
      user,
      studentNumber,
      school,
      dateOfBirth,
      gender,
      address,
      class: classId,
      parents,
      enrollmentDate,
      status,
    } = req.body;

    // Check user exists
    const existingUser = await User.findById(user);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // User must have student role
    if (existingUser.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "User role must be student",
      });
    }

    // Check if user already has a student profile
    const existingStudent = await Student.findOne({ user });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "This user is already a student",
      });
    }

    // Check student number
    const existingStudentNumber = await Student.findOne({
      studentNumber,
    });

    if (existingStudentNumber) {
      return res.status(409).json({
        success: false,
        message: "Student number already exists",
      });
    }

    const student = await Student.create({
      user,
      studentNumber,
      school,
      dateOfBirth,
      gender,
      address,
      class: classId,
      parents,
      enrollmentDate,
      status,
    });

    const populatedStudent = await Student.findById(student._id)
      .populate("user", "-password")
      .populate("school")
      .populate("class")
      .populate("parents");

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: populatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create student",
      error: error.message,
    });
  }
};

// Get all students
const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "-password")
      .populate("school")
      .populate("class")
      .populate("parents");

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get students",
      error: error.message,
    });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("user", "-password")
      .populate("school")
      .populate("class")
      .populate("parents");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get student",
      error: error.message,
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check student number uniqueness
    if (
      req.body.studentNumber &&
      req.body.studentNumber !== student.studentNumber
    ) {
      const existingStudent = await Student.findOne({
        studentNumber: req.body.studentNumber,
        _id: { $ne: student._id },
      });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "Student number already exists",
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("user", "-password")
      .populate("school")
      .populate("class")
      .populate("parents");

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message,
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};