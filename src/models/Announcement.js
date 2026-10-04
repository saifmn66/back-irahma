const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    target: {
      type: String,
      enum: [
        "all",
        "students",
        "parents",
        "teachers",
        "class",
      ],
      default: "all",
    },

    targetClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },

    attachments: [
      {
        name: String,
        url: String,
      },
    ],

    publishedAt: Date,

    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Announcement",
  announcementSchema
);