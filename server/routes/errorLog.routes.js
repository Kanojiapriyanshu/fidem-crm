const express = require("express");
const router = express.Router();

const {
  getAllErrorLogs,
  getSingleErrorLog,
  deleteErrorLog,
  clearAllErrorLogs,
} = require("../controllers/errorLogController");
const { adminAuth } = require("../middlewares/adminAuth");

// Get all error logs
router.get("/", adminAuth, getAllErrorLogs);

// Get single error log by MongoDB _id
router.get("/:id", adminAuth, getSingleErrorLog);

// Delete single error log
router.delete("/:id", adminAuth, deleteErrorLog);

// Clear all error logs
router.delete("/", adminAuth, clearAllErrorLogs);

module.exports = router;