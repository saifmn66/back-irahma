const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
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

    studentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

// Hash password before saving
studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password helper method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure password is not returned in JSON/Object conversions
studentSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

studentSchema.set("toObject", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("Student", studentSchema);