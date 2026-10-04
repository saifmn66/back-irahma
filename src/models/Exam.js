const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    type: {
      type: String,
      enum: ["quiz", "test", "midterm", "final", "exam"],
      required: true,
    },

    date: Date,

    duration: Number,

    maxScore: {
      type: Number,
      default: 20,
    },

    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);