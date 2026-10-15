const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staffController");

const {
  createStaffValidator,
  updateStaffValidator,
  updateStaffStatusValidator,
} = require("../validators/staffValidator");

// Create staff
router.post("/", createStaffValidator, staffController.createStaff);

// Get all staff
router.get("/", staffController.getAllStaff);

// Get staff by ID
router.get("/:id", staffController.getStaffById);

// Update staff
router.put("/:id", updateStaffValidator, staffController.updateStaff);

// Activate / deactivate staff
router.patch(
  "/:id/status",
  updateStaffStatusValidator,
  staffController.updateStaffStatus,
);

// Delete staff
router.delete("/:id", staffController.deleteStaff);

module.exports = router;
