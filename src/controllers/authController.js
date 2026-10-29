const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");

// Login for Teacher, Student, or Staff
const login = async (req, res) => {
  try {
    const {
      email,
      identifier,
      studentNumber,
      teacherNumber,
      password,
      role: requestedRole,
    } = req.body;

    const loginId = (
      email ||
      identifier ||
      studentNumber ||
      teacherNumber ||
      ""
    ).trim();

    if (!loginId) {
      return res.status(400).json({
        success: false,
        message: "Email or identification number is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    let user = null;
    let role = requestedRole;

    const lowerLoginId = loginId.toLowerCase();

    // Helper search query
    const searchFilter = (fieldNumber) => ({
      $or: [
        { email: lowerLoginId },
        { [fieldNumber]: loginId },
      ],
    });

    if (role === "teacher") {
      user = await Teacher.findOne(searchFilter("teacherNumber")).select("+password");
    } else if (role === "student") {
      user = await Student.findOne(searchFilter("studentNumber")).select("+password");
    } else if (role === "staff" || role === "admin" || role === "director") {
      user = await Staff.findOne({ email: lowerLoginId }).select("+password");
      if (user) role = user.role;
    } else {
      // Auto-detect role: check Teacher first, then Student, then Staff
      user = await Teacher.findOne(searchFilter("teacherNumber")).select("+password");
      if (user) {
        role = "teacher";
      } else {
        user = await Student.findOne(searchFilter("studentNumber")).select("+password");
        if (user) {
          role = "student";
        } else {
          user = await Staff.findOne({ email: lowerLoginId }).select("+password");
          if (user) {
            role = user.role;
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check account status
    if (user.status === "inactive" || user.status === "retired") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT
    const token = generateToken(user._id, role || "student");

    const userProfile = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      status: user.status,
    };

    if (role === "teacher") {
      userProfile.teacherNumber = user.teacherNumber;
      userProfile.specialization = user.specialization;
    } else if (role === "student") {
      userProfile.studentNumber = user.studentNumber;
      userProfile.class = user.class;
    } else {
      userProfile.role = user.role;
      userProfile.permissions = user.permissions;
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        role,
        user: userProfile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Change password for currently logged-in user
const changePassword = async (req, res) => {
  try {
    const { currentPassword, oldPassword, newPassword } = req.body;
    const currentPass = currentPassword || oldPassword;

    if (!currentPass || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    let user = null;

    if (req.user.role === "teacher") {
      user = await Teacher.findById(req.user.id).select("+password");
    } else if (req.user.role === "student") {
      user = await Student.findById(req.user.id).select("+password");
    } else {
      user = await Staff.findById(req.user.id).select("+password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const isMatch = await user.comparePassword(currentPass);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

// Get current profile
const getMe = async (req, res) => {
  try {
    let profile = null;

    if (req.user.role === "teacher") {
      profile = await Teacher.findById(req.user.id);
    } else if (req.user.role === "student") {
      profile = await Student.findById(req.user.id).populate("class");
    } else {
      profile = await Staff.findById(req.user.id).select("-password");
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        profile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
      error: error.message,
    });
  }
};

// Logout
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

module.exports = {
  login,
  changePassword,
  getMe,
  logout,
};
