const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const teacherSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    teacherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

    specialization: {
      type: String,
      trim: true,
    },

    hireDate: Date,

    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "retired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
teacherSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password helper method
teacherSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure password is not returned in JSON/Object conversions
teacherSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

teacherSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("Teacher", teacherSchema);