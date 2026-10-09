const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

// Generate JWT token helper
const generateToken = (id, role) => {
  return jwt.sign(
    {
      id,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// Login for both Teacher and Student
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

    // Build case-insensitive email query and exact number query
    const searchFilter = (fieldNumber) => ({
      $or: [
        { email: loginId.toLowerCase() },
        { [fieldNumber]: loginId },
      ],
    });

    if (role === "teacher") {
      user = await Teacher.findOne(searchFilter("teacherNumber")).select(
        "+password"
      );
    } else if (role === "student") {
      user = await Student.findOne(searchFilter("studentNumber")).select(
        "+password"
      );
    } else {
      // Auto-detect role: check Teacher first, then Student
      user = await Teacher.findOne(searchFilter("teacherNumber")).select(
        "+password"
      );
      if (user) {
        role = "teacher";
      } else {
        user = await Student.findOne(searchFilter("studentNumber")).select(
          "+password"
        );
        if (user) {
          role = "student";
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
    const token = generateToken(user._id, role);

    const userProfile = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      school: user.school,
    };

    if (role === "teacher") {
      userProfile.teacherNumber = user.teacherNumber;
      userProfile.specialization = user.specialization;
    } else {
      userProfile.studentNumber = user.studentNumber;
      userProfile.class = user.class;
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
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Change Password for authenticated Teacher or Student
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
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPass);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Set new password (pre-save hook will hash it)
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

// Get current authenticated profile
const getMe = async (req, res) => {
  try {
    let profile = null;

    if (req.user.role === "teacher") {
      profile = await Teacher.findById(req.user.id).populate("school");
    } else if (req.user.role === "student") {
      profile = await Student.findById(req.user.id)
        .populate("school")
        .populate("class")
        .populate("parents");
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
