const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    homework: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    files: [
      {
        name: String,
        url: String,
      },
    ],

    answer: String,

    submittedAt: Date,

    score: Number,

    teacherFeedback: String,

    status: {
      type: String,
      enum: ["submitted", "late", "graded"],
      default: "submitted",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);