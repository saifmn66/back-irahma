const Student = require("../models/Student");
const generateToken = require("../utils/generateToken");

// POST /api/auth/student/login
const loginStudent = async (req, res) => {
  try {
    const { email, identifier, studentNumber, password } = req.body;

    const loginId = String(
      email || identifier || studentNumber || ""
    ).trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Student identifier and password are required",
      });
    }

    const escapedLoginId = loginId.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const student = await Student.findOne({
      $or: [
        { email: { $regex: `^${escapedLoginId}$`, $options: "i" } },
        { studentNumber: loginId },
      ],
    }).select("+password");

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (student.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const isPasswordCorrect =
      await student.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(student._id, "student");

    return res.status(200).json({
      success: true,
      message: "Student login successful",
      data: {
        token,
        role: "student",
        user: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          studentNumber: student.studentNumber,
          class: student.class,
          status: student.status,
        },
      },
    });
  } catch (error) {
    console.error("Student login error:", error);

    return res.status(500).json({
      success: false,
      message: "Student login failed",
    });
  }
};

// PATCH /api/auth/student/change-password
const changeStudentPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (typeof currentPassword !== "string" ||
        typeof newPassword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Passwords must be strings",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Only student accounts can use this endpoint.
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student account required.",
      });
    }

    const student = await Student.findById(req.user.id)
      .select("+password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account not found",
      });
    }

    const isCurrentPasswordCorrect =
      await student.comparePassword(currentPassword);

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    student.password = newPassword;

    // The Student schema's pre-save hook should hash the password.
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Student password changed successfully",
    });
  } catch (error) {
    console.error("Change student password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change student password",
    });
  }
};

// GET /api/auth/student/me
const getStudentMe = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student account required.",
      });
    }

    const student = await Student.findById(req.user.id)
      .select("-password")
      .populate("class");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        role: "student",
        profile: student,
      },
    });
  } catch (error) {
    console.error("Get student profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student profile",
    });
  }
};

module.exports = {
  loginStudent,
  changeStudentPassword,
  getStudentMe,
};