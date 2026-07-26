'use strict';

const express = require('express');
const router = express.Router();

const {
  createCampaignReport,
  listCampaignReports,
  getPublicCampaignReport,
  refreshCampaignReport,
} = require('../controllers/campaignReportController');

// Admin action: attach a live video URL to a campaign/pitch-folder item and
// generate its first snapshot + public share link.
router.post('/', createCampaignReport);

// Admin listing page.
router.get('/', listCampaignReports);

// Public, no-login routes — the share link is the access control.
router.get('/public/:token', getPublicCampaignReport);
router.post('/public/:token/refresh', refreshCampaignReport);

module.exports = router;
