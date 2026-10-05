const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    level: {
      type: String,
      enum: ["7eme", "8eme", "9eme", "1ere", "2eme", "3eme", "4eme"],
      required: true,
    },

    section: {
      type: String,
      enum: [
        "lettres",
        "science",
        "informatique",
        "economie_gestion",
        "technique",
        "math",
      ],
      required: function () {
        return ["2eme", "3eme", "4eme"].includes(this.level);
      },
    },

    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    teachers: [
      {
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Teacher",
          required: true,
        },

        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
      },
    ],

    capacity: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Class", classSchema);
