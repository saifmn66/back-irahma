const mongoose = require("mongoose");

const studentPerformanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    academicYear: String,

    averageGrade: Number,

    attendanceRate: Number,

    homeworkCompletionRate: Number,

    trend: {
      type: String,
      enum: ["improving", "stable", "declining"],
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
    },

    predictedScore: Number,

    recommendations: [String],

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StudentPerformance",
  studentPerformanceSchema
);