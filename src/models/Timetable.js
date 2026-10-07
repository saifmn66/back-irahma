const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
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

    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
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

    room: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);