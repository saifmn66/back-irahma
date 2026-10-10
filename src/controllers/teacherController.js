
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Teacher = require("../models/Teacher");

// Helper: normalize email
const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : email;

// Helper: handle MongoDB duplicate key errors
const handleDuplicateError = (error, res) => {
  if (error.code !== 11000) return false;

  const field = Object.keys(error.keyPattern || {})[0];

  res.status(409).json({
    success: false,
    field: field || "unknown",
    message: field
      ? `A teacher with this ${field} already exists`
      : "A teacher with this unique value already exists",
  });

  return true;
};

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
      dateOfBirth,
      gender,
      address,
      specialization,
      hireDate,
      status,
    } = req.body;

    // Validate required fields
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !teacherNumber?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName and teacherNumber are required",
      });
    }

    // Validate password when provided
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check duplicate teacher number
    const existingTeacherNumber = await Teacher.findOne({
      teacherNumber: teacherNumber.trim(),
    });

    if (existingTeacherNumber) {
      return res.status(409).json({
        success: false,
        field: "teacherNumber",
        message: "Teacher number already exists",
      });
    }

    // Check duplicate email
    if (normalizedEmail) {
      const existingEmail = await Teacher.findOne({
        email: normalizedEmail,
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          field: "email",
          message: "Email already exists",
        });
      }
    }

    // Create teacher.
    // The schema's pre-save hook hashes the password.
    const teacher = await Teacher.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail || undefined,
      password: password || teacherNumber.trim(),
      phone: phone?.trim() || undefined,
      teacherNumber: teacherNumber.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      address: address?.trim() || undefined,
      specialization: specialization?.trim() || undefined,
      hireDate: hireDate || undefined,
      status: status || "active",
    });

    // Password is excluded from query results by select: false
    const createdTeacher = await Teacher.findById(teacher._id);

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: createdTeacher,
    });
  } catch (error) {
    if (handleDuplicateError(error, res)) return;

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create teacher",
      error: error.message,
    });
  }
};

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get teachers",
      error: error.message,
    });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get teacher",
      error: error.message,
    });
  }
};

// Update teacher
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await Teacher.findById(id).select("+password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const updateData = { ...req.body };

    // Do not allow changing MongoDB's internal ID
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Normalize fields
    if (updateData.firstName !== undefined) {
      updateData.firstName = updateData.firstName.trim();
    }

    if (updateData.lastName !== undefined) {
      updateData.lastName = updateData.lastName.trim();
    }

    if (updateData.teacherNumber !== undefined) {
      updateData.teacherNumber = updateData.teacherNumber.trim();
    }

    if (updateData.email !== undefined) {
      updateData.email = normalizeEmail(updateData.email);
      if (!updateData.email) delete updateData.email;
    }

    // Check teacher number uniqueness
    if (
      updateData.teacherNumber &&
      updateData.teacherNumber !== teacher.teacherNumber
    ) {
      const duplicateNumber = await Teacher.findOne({
        teacherNumber: updateData.teacherNumber,
        _id: { $ne: id },
      });

      if (duplicateNumber) {
        return res.status(409).json({
          success: false,
          field: "teacherNumber",
          message: "Teacher number already exists",
        });
      }
    }

    // Check email uniqueness
    if (
      updateData.email &&
      updateData.email !== teacher.email
    ) {
      const duplicateEmail = await Teacher.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (duplicateEmail) {
        return res.status(409).json({
          success: false,
          field: "email",
          message: "Email already exists",
        });
      }
    }

    // Hash a new password exactly once
    if (updateData.password !== undefined) {
      if (
        typeof updateData.password !== "string" ||
        updateData.password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least 6 characters",
        });
      }

      updateData.password = await bcrypt.hash(
        updateData.password,
        12
      );
    }

    // Apply allowed updates and validate using the schema
    teacher.set(updateData);

    // save() runs schema validation and the pre-save hook.
    // The password hook will not hash an already-hashed password
    // again unless the password is modified by the caller.
    await teacher.save();

    const updatedTeacher = await Teacher.findById(id);

    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    if (handleDuplicateError(error, res)) return;

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher data",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update teacher",
      error: error.message,
    });
  }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
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
