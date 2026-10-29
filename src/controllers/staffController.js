const Staff = require("../models/Staff");
const generateToken = require("../utils/generateToken");

// Login staff member
exports.loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const staff = await Staff.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (staff.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact the administrator.",
      });
    }

    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(staff._id, staff.role);

    const userProfile = staff.toObject();
    delete userProfile.password;
    delete userProfile.__v;

    return res.status(200).json({
      success: true,
      message: "Staff login successful",
      data: {
        token,
        role: staff.role,
        user: userProfile,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during staff login",
    });
  }
};

// Create a new staff member
exports.createStaff = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      permissions,
      status,
    } = req.body;

    // Only an authorized admin should create staff accounts.
    // Enforce this in route middleware as well.

    const existingStaff = await Staff.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: "A staff member with this email already exists",
      });
    }

    const staff = await Staff.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      permissions,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: staff,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all staff members with pagination and optional search
exports.getAllStaff = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search) {
      const search = req.query.search.trim();

      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const regex = new RegExp(escapedSearch, "i");

        filter.$or = [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { phone: regex },
        ];
      }
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Staff.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      results: staff.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get one staff member by ID
exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const staff = await Staff.findById(id).select("-password").lean();

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Get staff by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update staff information
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "role",
      "permissions",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Password changes must go through the save hook.
    if (req.body.password !== undefined) {
      updates.password = req.body.password;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const staff = await Staff.findById(id).select("+password");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Assign fields and use save() so password hashing and
    // Mongoose schema validation run correctly.
    for (const [field, value] of Object.entries(updates)) {
      staff.set(field, value);
    }

    await staff.save();

    const result = staff.toObject();
    delete result.password;
    delete result.__v;

    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Activate or deactivate a staff member
exports.updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive",
      });
    }

    const staff = await Staff.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .select("-password")
      .lean();

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Staff member ${status} successfully`,
      data: staff,
    });
  } catch (error) {
    console.error("Update staff status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a staff member
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    // Prevent deleting the currently authenticated account.
    // Requires authentication middleware to set req.staff._id.
    if (req.staff && req.staff._id && req.staff._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const staff = await Staff.findByIdAndDelete(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
