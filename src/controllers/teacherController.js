const bcrypt = require("bcryptjs");
const Teacher = require("../models/Teacher");

// Create teacher
const createTeacher = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      teacherNumber,
      school,
      dateOfBirth,
      gender,
      address,
      specialization,
      hireDate,
      status,
    } = req.body;

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

    // Check email uniqueness if email is provided
    if (email) {
      const existingEmail = await Teacher.findOne({ email });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const teacherData = {
      firstName,
      lastName,
      password: password || teacherNumber,
      teacherNumber,
      school,
      dateOfBirth,
      gender,
      address,
      specialization,
      hireDate,
      status,
    };

    if (email) teacherData.email = email;
    if (phone) teacherData.phone = phone;

    const teacher = await Teacher.create(teacherData);

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate("school");

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: populatedTeacher,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A teacher with this unique value already exists",
      });
    }

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

    // Check email uniqueness if email is being changed
    if (req.body.email && req.body.email !== teacher.email) {
      const existingEmail = await Teacher.findOne({
        email: req.body.email,
        _id: { $ne: teacher._id },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    const updateData = { ...req.body };

    // Hash password if being updated directly
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("school");

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A teacher with this unique value already exists",
      });
    }

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