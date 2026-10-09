const express = require("express");

const {
  login,
  changePassword,
  getMe,
  logout,
} = require("../controllers/authController");

const {
  loginValidator,
  changePasswordValidator,
} = require("../validators/auth.validator");

const validate = require("../middleware/validation.middleware");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Login for student or teacher
router.post("/login", loginValidator, validate, login);

// Change password for currently logged-in student or teacher
router.post(
  "/change-password",
  protect,
  changePasswordValidator,
  validate,
  changePassword
);
router.put(
  "/change-password",
  protect,
  changePasswordValidator,
  validate,
  changePassword
);

// Get current profile
router.get("/me", protect, getMe);

// Logout
router.post("/logout", logout);

module.exports = router;
