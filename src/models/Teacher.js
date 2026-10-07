const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    teacherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    dateOfBirth: Date,

    gender: {
      type: String,
      enum: ["male", "female"],
    },

    address: String,

    specialization: {
      type: String,
      trim: true,
    },

    hireDate: Date,

    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "retired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Teacher", teacherSchema);