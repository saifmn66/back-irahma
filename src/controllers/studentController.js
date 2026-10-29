const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Class = require("../models/Class");


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

    if (classId) {
      await Class.findByIdAndUpdate(classId, {
        $addToSet: { students: student._id },
      });
    }

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


// Get all students with optional search & filter params
const getStudents = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.gender) {
      filter.gender = req.query.gender;
    }

    if (req.query.class || req.query.classId) {
      filter.class = req.query.class || req.query.classId;
    }

    if (req.query.search) {
      const search = req.query.search.trim();
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedSearch, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { studentNumber: regex },
        { email: regex },
      ];
    }

    const students = await Student.find(filter)
      .populate("class")
      .sort({ createdAt: -1 });

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

// Bulk delete students
const bulkDeleteStudents = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An array of student IDs is required",
      });
    }

    const result = await Student.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} students deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete students",
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

    if (student.class) {
      await Class.findByIdAndUpdate(student.class, {
        $pull: { students: student._id },
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

const getAllActiveStudentsNumber = async (req , res ) => {
  try {
    const activeStudentsCount = await Student.countDocuments({ status: "active" });
    return res.status(200).json({
      success: true,
      count: activeStudentsCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get active students count",
      error: error.message,
    });
  }
}

// Change student from one class to another class
const changeStudentClass = async (req, res) => {
  try {
    const studentId = req.params.id;
    const targetClassId =
      req.body.newClassId || req.body.classId || req.body.class;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    if (!targetClassId || !mongoose.isValidObjectId(targetClassId)) {
      return res.status(400).json({
        success: false,
        message: "Valid target class ID is required",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const targetClass = await Class.findById(targetClassId);
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: "Target class not found",
      });
    }

    const oldClassId = student.class ? student.class.toString() : null;

    if (oldClassId && oldClassId === targetClassId.toString()) {
      return res.status(400).json({
        success: false,
        message: `Student is already enrolled in ${targetClass.name}`,
      });
    }

    // Capacity verification
    const currentStudentCount = await Student.countDocuments({
      class: targetClass._id,
      status: { $ne: "transferred" },
      _id: { $ne: student._id },
    });

    if (
      typeof targetClass.capacity === "number" &&
      currentStudentCount >= targetClass.capacity
    ) {
      return res.status(400).json({
        success: false,
        message: `Target class ${targetClass.name} has reached its maximum capacity (${targetClass.capacity} students)`,
      });
    }

    let previousClass = null;
    if (oldClassId) {
      previousClass = await Class.findById(oldClassId);
      await Class.findByIdAndUpdate(oldClassId, {
        $pull: { students: student._id },
      });
    }

    await Class.findByIdAndUpdate(targetClassId, {
      $addToSet: { students: student._id },
    });

    student.class = targetClass._id;
    await student.save();

    const populatedStudent = await Student.findById(student._id).populate("class");

    return res.status(200).json({
      success: true,
      message: previousClass
        ? `Student transferred from ${previousClass.name} to ${targetClass.name} successfully`
        : `Student assigned to ${targetClass.name} successfully`,
      data: populatedStudent,
      meta: {
        previousClass: previousClass
          ? { _id: previousClass._id, name: previousClass.name }
          : null,
        newClass: { _id: targetClass._id, name: targetClass.name },
        reason: reason || null,
        transferredAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Change student class error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change student class",
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
  bulkDeleteStudents,
  getAllActiveStudentsNumber,
  changeStudentClass,
};