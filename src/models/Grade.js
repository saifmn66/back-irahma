const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    teacherComment: String,

    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Grade", gradeSchema);