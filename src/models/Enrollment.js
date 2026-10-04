const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    enrollmentDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "completed", "transferred"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);