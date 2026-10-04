const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: String,

    role: {
      type: String,
      enum: [
        "student",
        "parent",
        "teacher",
        "admin",
        "school_admin",
      ],
      required: true,
    },

    avatar: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);