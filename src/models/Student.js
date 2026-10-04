const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    studentNumber: {
      type: String,
      required: true,
      unique: true,
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

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    parents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
      },
    ],

    enrollmentDate: Date,

    status: {
      type: String,
      enum: ["active", "graduated", "transferred", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);