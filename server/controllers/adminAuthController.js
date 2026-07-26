'use strict';

// Slim admin auth/management controller for Fidem.
// Extracted from the original masterController.js (adminLogin -> adminMe),
// with all brand/campaign-marketplace dependencies removed since Fidem has
// no brand or influencer accounts — this is an admin-only panel.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { AdminModel, ROLES, PROXY_EMAIL_DOMAIN } = require("../models/master");
const {
  canInviteRole,
  buildAdminVisibilityFilter,
  canManageTarget,
} = require("../utils/adminHierarchy");
const { sendEmail } = require("../services/emailService");
const { adminInviteEmailTemplate } = require("../template/inviteRole");
const mongoose = require("mongoose");

const DEFAULT_INVITE_EXP_MINUTES = 5;
const parsedInviteExpiry = Number(process.env.INVITE_EXP_MINUTES);
const INVITE_EXP_MINUTES =
  Number.isFinite(parsedInviteExpiry) && parsedInviteExpiry > 0
    ? parsedInviteExpiry
    : DEFAULT_INVITE_EXP_MINUTES;

const clean = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const exactCI = (value) => {
  const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
};

const parseAccess = (access) => {
  if (!Array.isArray(access)) return [];

  return access
    .map((item) => {
      if (typeof item === "string") {
        const key = item.trim().toLowerCase();
        if (!key) return null;

        return {
          key,
          name: key,
          isDelete: true,
          isEdit: true,
          isManager: false,
        };
      }

      if (item && typeof item === "object") {
        const key = clean(item.key).toLowerCase();
        if (!key) return null;

        return {
          key,
          name: clean(item.name) || key,
          isDelete: item.isDelete !== undefined ? Boolean(item.isDelete) : true,
          isEdit: item.isEdit !== undefined ? Boolean(item.isEdit) : true,
          isManager: item.isManager !== undefined ? Boolean(item.isManager) : false,
        };
      }

      return null;
    })
    .filter(Boolean);
};

const generateInviteToken = (size = 32) => {
  return crypto.randomBytes(size).toString("hex");
};

const sha256 = (value) => {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
};

function normalizeRole(role) {
  return clean(role).toLowerCase();
}

exports.adminLogin = async (req, res) => {
  try {
    const email = clean(req.body?.email).toLowerCase();
    const password = clean(req.body?.password);

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const admin = await AdminModel.findOne({ email: exactCI(email) }).select(
      "+passwordHash role status name email access parentAdmin rootAdmin proxyEmail"
    );

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (admin.status !== "active") {
      return res.status(403).json({ message: `Admin is ${admin.status}` });
    }

    if (!admin.passwordHash) {
      return res.status(403).json({
        message: "Password not set. Please use invite link.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is missing in env" });
    }

    const payload = {
      adminId: admin._id.toString(),
      role: admin.role,
      email: admin.email,
      parentAdmin: admin.parentAdmin ? String(admin.parentAdmin) : null,
      rootAdmin: admin.rootAdmin ? String(admin.rootAdmin) : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    admin.lastLoginAt = new Date();
    await admin.save();

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        access: admin.access || [],
        parentAdmin: admin.parentAdmin,
        rootAdmin: admin.rootAdmin,
        proxyEmail: admin.proxyEmail,
      },
    });
  } catch (err) {
    await saveErrorLog(req, err, err?.statusCode || err?.status || 500, "ADMIN_LOGIN_ERROR");
    return res.status(500).json({ message: err.message || "Internal error" });
  }
};

async function ensureUniqueProxyEmail(proxyEmail, currentAdminId) {
  const existing = await AdminModel.findOne({
    proxyEmail,
    ...(currentAdminId ? { _id: { $ne: currentAdminId } } : {}),
  }).select("_id proxyEmail");

  if (existing) {
    throw new Error("Proxy email already in use");
  }

  return proxyEmail;
}

// ======================
// Invite Admin
// ======================
exports.inviteAdmin = async (req, res) => {
  try {
    const actor = req.admin;

    if (!actor?.adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const email = clean(req.body?.email).toLowerCase();
    const role = normalizeRole(req.body?.role);
    const name = clean(req.body?.name);
    const access = parseAccess(req.body?.access);
    const explicitParentAdmin = clean(req.body?.parentAdmin);
    const requestedProxyEmail = normalizeProxyEmailInput(req.body?.proxyEmail);

    if (!email || !role) {
      return res.status(400).json({ message: "email and role are required" });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!canInviteRole(actor.role, role)) {
      return res.status(403).json({
        message: "You are not allowed to invite this role",
      });
    }

    let parentAdminDoc = null;

    if (actor.role === ROLES.SUPER_ADMIN && EXECUTIVE_ROLES.includes(role)) {
      if (!explicitParentAdmin) {
        return res.status(400).json({
          message:
            "parentAdmin is required when Super Admin invites IME/BME/SDR directly",
        });
      }

      parentAdminDoc = await AdminModel.findById(explicitParentAdmin).select(
        "_id role rootAdmin"
      );

      if (!parentAdminDoc || parentAdminDoc.role !== ROLES.REVENUE_HEAD) {
        return res.status(400).json({
          message: "parentAdmin must be a valid Revenue Head",
        });
      }
    }

    let admin = await AdminModel.findOne({ email: exactCI(email) }).select(
      "+passwordHash +inviteTokenHash"
    );

    const hierarchy = resolveHierarchyFields(actor, role, parentAdminDoc?._id);

    if (admin && admin.status === "active" && admin.passwordHash) {
      return res.status(409).json({ message: "Admin already active" });
    }

    if (!admin) {
      admin = new AdminModel({
        email,
        name: name || undefined,
        role,
        status: "pending",
        access,
        createdBy: actor.adminId,
        parentAdmin: hierarchy.parentAdmin,
        rootAdmin: hierarchy.rootAdmin,
        teamType: hierarchy.teamType,
      });
    } else {
      admin.role = role;
      if (name) admin.name = name;
      admin.status = "pending";

      if (Array.isArray(req.body?.access)) {
        admin.access = access;
      }

      admin.createdBy = actor.adminId;
      admin.parentAdmin = hierarchy.parentAdmin;
      admin.rootAdmin = hierarchy.rootAdmin;
      admin.teamType = hierarchy.teamType;
    }

    if (requestedProxyEmail) {
      admin.proxyEmail = await ensureUniqueProxyEmail(
        requestedProxyEmail,
        admin._id
      );
    } else if (!admin.proxyEmail) {
      admin.proxyEmail = await generateUniqueProxyEmail(
        admin.name,
        admin.email,
        admin._id
      );
    }

    const rawToken = generateInviteToken(32);
    const tokenHash = sha256(rawToken);
    const invitedAt = new Date();

    admin.invitedAt = invitedAt;
    admin.inviteTokenHash = tokenHash;
    admin.inviteExpiresAt = new Date(
      invitedAt.getTime() + INVITE_EXP_MINUTES * 60 * 1000
    );

    // Important: on every new invite/re-invite, force email verification again.
    admin.emailVerified = false;
    admin.emailVerifiedAt = undefined;

    await admin.save();

    const adminAppUrl = process.env.ADMIN_APP_URL || "https://fidem.com";

    // This should be your backend public URL.
    // Example: https://api.fidem.com
    const apiPublicUrl =
      process.env.API_PUBLIC_URL ||
      process.env.BACKEND_URL ||
      process.env.SERVER_URL;

    if (!apiPublicUrl) {
      throw new Error("API_PUBLIC_URL is required for admin invite verification link");
    }

    const verificationLink = `${apiPublicUrl.replace(/\/$/, "")}/admins/verify-invite-email?token=${rawToken}`;

    const tpl = adminEmailVerificationTemplate({
      invitedEmail: email,
      verificationLink,
      role,
      expiryMinutes: INVITE_EXP_MINUTES,
    });

    await sendEmail({
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    await notifySafely("inviteAdmin", req, {
      adminId: String(admin._id),
      type: "admin.invited",
      title: "Admin invite sent",
      message: `You were invited as ${role.replace(/_/g, " ")}.`,
      entityType: "admin",
      entityId: String(admin._id),
      actionPath: {
        admin: "/admin/profile",
      },
    });

    const response = {
      message: "Verification email sent successfully",
    };

    if (process.env.NODE_ENV !== "production") {
      response.verificationLink = verificationLink;
    }

    return res.status(201).json(response);
  } catch (err) {
    await saveErrorLog(req, err, err?.statusCode || err?.status || 500, "INVITE_ADMIN_ERROR");
    if (err.message === "Proxy email already in use") {
      return res.status(409).json({ message: err.message });
    }

    return res.status(500).json({ message: err.message || "Internal error" });
  }
};


exports.verifyInviteEmail = async (req, res) => {
  const adminAppUrl = process.env.ADMIN_APP_URL || "https://fidem.com";

  const buildRedirectUrl = (params = {}) => {
    const url = new URL("/admin/invite", adminAppUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  };

  try {
    const token = clean(req.query?.token || req.body?.token);

    if (!token) {
      return res.redirect(
        buildRedirectUrl({
          verified: "0",
          reason: "missing_token",
        })
      );
    }

    const tokenHash = sha256(token);

    const admin = await AdminModel.findOne({
      inviteTokenHash: tokenHash,
    }).select(
      "+inviteTokenHash role status email name inviteExpiresAt emailVerified emailVerifiedAt"
    );

    if (!admin) {
      return res.redirect(
        buildRedirectUrl({
          token,
          verified: "0",
          reason: "invalid_token",
        })
      );
    }

    const now = new Date();

    if (!admin.inviteExpiresAt || admin.inviteExpiresAt <= now) {
      return res.redirect(
        buildRedirectUrl({
          token,
          verified: "0",
          reason: "expired_token",
        })
      );
    }

    admin.emailVerified = true;
    admin.emailVerifiedAt = now;

    await admin.save();

    return res.redirect(
      buildRedirectUrl({
        token,
        verified: "1",
      })
    );
  } catch (err) {
    await saveErrorLog(req, err, err?.statusCode || err?.status || 500, "VERIFY_INVITE_EMAIL_ERROR");
    return res.redirect(
      buildRedirectUrl({
        verified: "0",
        reason: "server_error",
      })
    );
  }
};

// ======================
// Accept Invite + Set Password
// ======================
exports.acceptInviteSetPassword = async (req, res) => {
  try {
    const token = clean(req.body?.token);
    const password = clean(req.body?.password);

    if (!token || !password) {
      return res.status(400).json({
        message: "token and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const tokenHash = sha256(token);

    const admin = await AdminModel.findOne({
      inviteTokenHash: tokenHash,
    }).select(
      "+inviteTokenHash +passwordHash role status email name access proxyEmail parentAdmin rootAdmin inviteExpiresAt emailVerified emailVerifiedAt"
    );

    if (!admin) {
      return res.status(400).json({
        message: "Invite token invalid. Please request a new invite.",
      });
    }

    const now = new Date();

    if (!admin.inviteExpiresAt || admin.inviteExpiresAt <= now) {
      return res.status(400).json({
        message: "Invite token expired. Please request a new invite.",
      });
    }

    if (!admin.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before setting password.",
      });
    }

    admin.passwordHash = await bcrypt.hash(password, 10);
    admin.status = "active";

    if (!admin.proxyEmail) {
      admin.proxyEmail = await generateUniqueProxyEmail(
        admin.name,
        admin.email,
        admin._id
      );
    }

    admin.inviteTokenHash = undefined;
    admin.inviteExpiresAt = undefined;

    await admin.save();

    await notifySafely("acceptInviteSetPassword", req, {
      adminId: String(admin._id),
      type: "admin.activated",
      title: "Admin account activated",
      message: "Your admin account is now active.",
      entityType: "admin",
      entityId: String(admin._id),
      actionPath: {
        admin: "/admin/dashboard",
      },
    });

    return res.status(200).json({
      message: "Password set successfully. Please login.",
      proxyEmail: admin.proxyEmail,
    });
  } catch (err) {
    await saveErrorLog(req, err, err?.statusCode || err?.status || 500, "ACCEPT_INVITE_SET_PASSWORD_ERROR");
    return res.status(500).json({
      message: err.message || "Internal error",
    });
  }
};

// ======================
// List Admins - SCOPED
// ======================
exports.listAdmins = async (req, res) => {
  try {
    const actor = req.admin;

    if (!actor?.adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const filter = await buildAdminVisibilityFilter(actor);

    const admins = await AdminModel.find(filter)
      .select(
        "email name role status invitedAt proxyEmail lastLoginAt createdAt updatedAt access parentAdmin rootAdmin createdBy"
      )
      .populate("parentAdmin", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json(admins);
  } catch (err) {
    await saveErrorLog(req, err, err?.statusCode || err?.status || 500, "LIST_ADMINS_ERROR");
    return res.status(500).json({
      message: err.message || "Internal error",
    });
  }
};

// ======================
// Update Admin Status / Role / Access - SCOPED
// ======================
exports.updateStatus = async (req, res) => {
  try {
    const actor = req.admin;

    if (!actor?.adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const adminId = clean(req.body?.adminId);
    const status = clean(req.body?.status).toLowerCase();
    const role = normalizeRole(req.body?.role);
    const hasNameField = Object.prototype.hasOwnProperty.call(req.body, "name");
    const name = clean(req.body?.name);

    const accessProvided = Array.isArray(req.body?.access);
    const access = parseAccess(req.body?.access);

    if (!adminId || !status) {
      return res.status(400).json({
        message: "adminId and status are required",
      });
    }

    if (!["pending", "active", "inactive", "suspended"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const admin = await AdminModel.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const allowed = await canManageTarget(
      { ...actor, _id: actor._id || actor.adminId },
      admin._id
    );

    if (!allowed) {
      return res.status(403).json({
        message: "You are not allowed to update this admin",
      });
    }

    const currentRole = normalizeRole(admin.role);
    const roleChanged = Boolean(role) && role !== currentRole;

    if (roleChanged) {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      if (!canInviteRole(actor.role, role)) {
        return res.status(403).json({
          message: "You are not allowed to assign this role",
        });
      }

      admin.role = role;
    }

    if (hasNameField) {
      admin.name = name || undefined;
    }

    admin.status = status;

    if (accessProvided) {
      admin.access = access;
    }

    await admin.save();

    await notifySafely("updateStatus", req, {
      adminId: String(admin._id),
      type: "admin.status_updated",
      title: "Admin account updated",
      message: `Your admin account status is now ${admin.status}.`,
      entityType: "admin",
      entityId: String(admin._id),
      actionPath: {
        admin: "/admin/profile",
      },
    });

    return res.status(200).json({
      message: "Admin updated successfully",
    });
  } catch (err) {
    await saveErrorLog(req, err, err?.statusCode || err?.status || 500, "UPDATE_STATUS_ERROR");
    return res.status(500).json({
      message: err.message || "Internal error",
    });
  }
};

// ======================
// Admin Me
// ======================
exports.adminMe = async (req, res) => {
  try {
    const adminId = req.admin?.adminId;

    if (!adminId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const admin = await AdminModel.findById(adminId).select(
      "email name role status access lastLoginAt createdAt updatedAt parentAdmin rootAdmin proxyEmail "
    );

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    const permissions = Array.isArray(admin.access)
      ? admin.access.map((p) => ({
        key: String(p?.key || "").toLowerCase().trim(),
        name: p?.name ? String(p.name) : undefined,
        isEdit: Boolean(p?.isEdit),
        isDelete: Boolean(p?.isDelete),
        isManager: Boolean(p?.isManager),
      }))
      : [];

    const canEditPermissions =
      String(admin.status || "").toLowerCase() === "active" &&
      permissions.some((p) => p.isEdit === true);

    return res.status(200).json({
      _id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      proxyEmail: admin.proxyEmail,
      updatedAt: admin.updatedAt,
      parentAdmin: admin.parentAdmin,
      rootAdmin: admin.rootAdmin,
      permissions,
      canEditPermissions,
    });
  } catch (err) {
    await saveErrorLog(req, err, err?.statusCode || err?.status || 500, "ADMIN_ME_ERROR");
    return res.status(500).json({
      message: err.message || "Internal error",
    });
  }
};

