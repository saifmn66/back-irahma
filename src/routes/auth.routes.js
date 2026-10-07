const express = require("express");

const {
  register,
  login,
  getMe,
  logout,
} = require("../controllers/authController");

const { createUserValidator } = require("../validators/user.validator");
const validate = require("../middleware/validation.middleware");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", createUserValidator, validate, register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;
