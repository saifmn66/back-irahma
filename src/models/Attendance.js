const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },

    note: String,

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);