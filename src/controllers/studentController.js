const Student = require("../models/Student");
const User = require("../models/User");

// Create student
exports.createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      studentNumber,
      school,
      dateOfBirth,
      gender,
      address,
      class: classId,
      parents,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: "student",
    });

    // Create student
    const student = await Student.create({
      user: user._id,
      studentNumber,
      school,
      dateOfBirth,
      gender,
      address,
      class: classId,
      parents,
    });

    res.status(201).json({
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating student",
      error: error.message,
    });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "-password")
      .populate("school")
      .populate("class")
      .populate("parents", "-password");

    res.status(200).json({
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching students",
      error: error.message,
    });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("user", "-password")
      .populate("school")
      .populate("class")
      .populate("parents", "-password");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching student",
      error: error.message,
    });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const {
      studentNumber,
      school,
      dateOfBirth,
      gender,
      address,
      class: classId,
      parents,
    } = req.body;

    Object.assign(student, {
      studentNumber,
      school,
      dateOfBirth,
      gender,
      address,
      class: classId,
      parents,
    });

    await student.save();

    // Update User information if provided
    if (
      req.body.firstName ||
      req.body.lastName ||
      req.body.email ||
      req.body.phone
    ) {
      await User.findByIdAndUpdate(student.user, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
      });
    }

    res.status(200).json({
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating student",
      error: error.message,
    });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Delete associated user
    await User.findByIdAndDelete(student.user);

    // Delete student
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting student",
      error: error.message,
    });
  }
};