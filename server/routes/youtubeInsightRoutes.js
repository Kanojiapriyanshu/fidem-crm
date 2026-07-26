'use strict';

const express = require('express');
const {
  analyzeYoutubeVideo,
  getYoutubeInsightReports,
  getYoutubeInsightReportById,
  refreshYoutubeInsightReportById,
  getYoutubeInsightSummary,
  deleteYoutubeInsightReport,
  createYoutubeInsightPublicLink,
  getYoutubeInsightPublicShare
} = require("../controllers/youtubeInsightController");
const { adminAuth } = require("../middlewares/adminAuth");

const router = express.Router();

// Admin-authenticated so req.admin is populated (needed for saved/persisted
// reports and full list access — this app is admin-only, no brand accounts).
router.post('/analyze', adminAuth, analyzeYoutubeVideo);
router.post('/share', adminAuth, createYoutubeInsightPublicLink);
router.get('/', adminAuth, getYoutubeInsightReports);
router.get('/summary', adminAuth, getYoutubeInsightSummary);
router.get('/:id', adminAuth, getYoutubeInsightReportById);
router.post("/:id/refresh", adminAuth, refreshYoutubeInsightReportById);
router.delete('/:id', adminAuth, deleteYoutubeInsightReport);

// Public, no-login route — the share token itself is the access control.
router.get('/public/:token', getYoutubeInsightPublicShare);

module.exports = router;