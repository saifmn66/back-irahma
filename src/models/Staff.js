const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const STAFF_ROLES = [
  "admin",
  "director",
  "secretary",
  "academic_administrator",
  "administrative_staff",
];

const STAFF_PERMISSIONS = [
  // Students
  "students:read",
  "students:create",
  "students:update",
  "students:delete",

  // Teachers
  "teachers:read",
  "teachers:create",
  "teachers:update",
  "teachers:delete",

  // Subjects
  "subjects:read",
  "subjects:create",
  "subjects:update",
  "subjects:delete",

  // Classes
  "classes:read",
  "classes:create",
  "classes:update",
  "classes:delete",

  // Timetable
  "timetable:read",
  "timetable:manage",

  // Attendance
  "attendance:read",
  "attendance:manage",

  // Staff
  "staff:read",
  "staff:manage",
];

const staffSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    role: {
      type: String,
      enum: STAFF_ROLES,
      default: "administrative_staff",
      required: true,
    },

    permissions: {
      type: [
        {
          type: String,
          enum: STAFF_PERMISSIONS,
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Hash the password when creating or changing it.
staffSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Compare the login password with the stored hash.
staffSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON responses.
staffSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Staff", staffSchema);
