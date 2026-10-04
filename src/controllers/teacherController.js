const Teacher = require("../models/Teacher");
const User = require("../models/User");

// Create teacher
exports.createTeacher = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      teacherNumber,
      school,
      subjects,
      specialization,
      hireDate,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: "teacher",
    });

    const teacher = await Teacher.create({
      user: user._id,
      teacherNumber,
      school,
      subjects,
      specialization,
      hireDate,
    });

    res.status(201).json({
      message: "Teacher created successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating teacher",
      error: error.message,
    });
  }
};

// Get all teachers
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("user", "-password")
      .populate("school")
      .populate("subjects");

    res.status(200).json({
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching teachers",
      error: error.message,
    });
  }
};

// Get teacher by ID
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate("user", "-password")
      .populate("school")
      .populate("subjects");

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching teacher",
      error: error.message,
    });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    teacher.teacherNumber =
      req.body.teacherNumber ?? teacher.teacherNumber;

    teacher.school =
      req.body.school ?? teacher.school;

    teacher.subjects =
      req.body.subjects ?? teacher.subjects;

    teacher.specialization =
      req.body.specialization ?? teacher.specialization;

    teacher.hireDate =
      req.body.hireDate ?? teacher.hireDate;

    await teacher.save();

    // Update User
    if (
      req.body.firstName ||
      req.body.lastName ||
      req.body.email ||
      req.body.phone
    ) {
      await User.findByIdAndUpdate(teacher.user, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
      });
    }

    res.status(200).json({
      message: "Teacher updated successfully",
      teacher,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating teacher",
      error: error.message,
    });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    await User.findByIdAndDelete(teacher.user);
    await Teacher.findByIdAndDelete(teacher._id);

    res.status(200).json({
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting teacher",
      error: error.message,
    });
  }
};