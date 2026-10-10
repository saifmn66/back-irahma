const mongoose = require("mongoose");

const classSubjectSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    coefficient: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("ClassSubject", classSubjectSchema);