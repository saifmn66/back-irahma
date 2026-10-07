const Teacher = require("../models/Teacher");
const User = require("../models/User");

// Create teacher
const createTeacher = async (req, res) => {
  try {
    const {
      user,
      teacherNumber,
      school,
      dateOfBirth,
      gender,
      address,
      specialization,
      hireDate,
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

    // User must have teacher role
    if (existingUser.role !== "teacher") {
      return res.status(400).json({
        success: false,
        message: "User role must be teacher",
      });
    }

    // Check if user is already linked to a teacher
    const existingTeacher = await Teacher.findOne({ user });

    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "This user is already a teacher",
      });
    }

    // Check teacher number
    const existingTeacherNumber = await Teacher.findOne({
      teacherNumber,
    });

    if (existingTeacherNumber) {
      return res.status(409).json({
        success: false,
        message: "Teacher number already exists",
      });
    }

    const teacher = await Teacher.create({
      user,
      teacherNumber,
      school,
      dateOfBirth,
      gender,
      address,
      specialization,
      hireDate,
      status,
    });

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate("user", "-password")
      .populate("school");

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: populatedTeacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create teacher",
      error: error.message,
    });
  }
};

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("user", "-password")
      .populate("school");

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get teachers",
      error: error.message,
    });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate("user", "-password")
      .populate("school");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get teacher",
      error: error.message,
    });
  }
};

// Update teacher
const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // If teacherNumber is being changed
    if (
      req.body.teacherNumber &&
      req.body.teacherNumber !== teacher.teacherNumber
    ) {
      const existingTeacher = await Teacher.findOne({
        teacherNumber: req.body.teacherNumber,
        _id: { $ne: teacher._id },
      });

      if (existingTeacher) {
        return res.status(409).json({
          success: false,
          message: "Teacher number already exists",
        });
      }
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("user", "-password")
      .populate("school");

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update teacher",
      error: error.message,
    });
  }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete teacher",
      error: error.message,
    });
  }
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};