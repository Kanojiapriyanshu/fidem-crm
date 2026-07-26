"use strict";

const express = require("express");
const router = express.Router();

const adminAuthController = require("../controllers/adminAuthController");
const { adminAuth } = require("../middlewares/adminAuth");
const { superOrRevenueHead } = require("../middlewares/adminRoleGuard");

router.post("/login", adminAuthController.adminLogin);
router.post("/invite", adminAuth, superOrRevenueHead, adminAuthController.inviteAdmin);
router.get("/verify-invite-email", adminAuthController.verifyInviteEmail);
router.post("/accept-invite", adminAuthController.acceptInviteSetPassword);

router.get("/list", adminAuth, adminAuthController.listAdmins);
router.put("/update-status", adminAuth, superOrRevenueHead, adminAuthController.updateStatus);
router.get("/me", adminAuth, adminAuthController.adminMe);

module.exports = router;
