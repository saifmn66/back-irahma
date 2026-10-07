const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    classSubject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSubject",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    students: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },

        status: {
          type: String,
          enum: ["present", "absent", "late", "excused"],
          default: "present",
        },

        note: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true },
);
module.exports = mongoose.model("Attendance", attendanceSchema);
