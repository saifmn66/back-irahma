const bcrypt = require("bcryptjs");
const Student = require("../models/Student");


// Create student
const createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      studentNumber,
      dateOfBirth,
      gender,
      address,
      class: classId,
      enrollmentDate,
      status,
    } = req.body;

    // Check student number uniqueness
    const existingStudentNumber = await Student.findOne({
      studentNumber,
    });

    if (existingStudentNumber) {
      return res.status(409).json({
        success: false,
        message: "Student number already exists",
      });
    }

    // Check email uniqueness if provided
    if (email) {
      const existingEmail = await Student.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Prepare student data
    const studentData = {
      firstName,
      lastName,
      password: password || studentNumber,
      studentNumber,
      dateOfBirth,
      gender,
      address,
      enrollmentDate,
      status,
    };

    // Add optional fields
    if (email) {
      studentData.email = email.toLowerCase().trim();
    }

    if (phone) {
      studentData.phone = phone;
    }

    if (classId) {
      studentData.class = classId;
    }

    // Create student
    const student = await Student.create(studentData);

    // Return student with class details, without password
    const populatedStudent = await Student.findById(student._id)
      .populate("class");

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: populatedStudent,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A student with this unique value already exists",
      });
    }

    console.error("Create student error:", error);

    return res.status(500).json({
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
      .populate("class")

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
      .populate("class")

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

    // Check student number uniqueness if updated
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

    // Check email uniqueness if updated
    if (req.body.email && req.body.email !== student.email) {
      const existingEmail = await Student.findOne({
        email: req.body.email,
        _id: { $ne: student._id },
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

    // Support class field aliases if sent as classId
    if (updateData.classId && !updateData.class) {
      updateData.class = updateData.classId;
      delete updateData.classId;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("class");

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A student with this unique value already exists",
      });
    }

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