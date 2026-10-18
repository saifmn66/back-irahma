const express = require("express");
const router = express.Router();

const {
  loginStudent,
  changeStudentPassword,
  getStudentMe,
} = require("../controllers/studentAuthController");

const { protect } = require("../middleware/auth.middleware");

router.post("/login", loginStudent);
router.patch("/change-password", protect, changeStudentPassword);
router.get("/me", protect, getStudentMe);

module.exports = router;
