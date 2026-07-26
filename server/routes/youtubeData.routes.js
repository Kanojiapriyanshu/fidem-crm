'use strict';

const express = require('express');
const router = express.Router();

const {
  browseCreators,
  getCreatorMediaKit,
  fetchRealAudienceDemographics,
  proxyImage,
  recommendInfluencersForCampaign,
} = require('../controllers/youtubeData.controller');
const { modashApiLimiter } = require('../middlewares/rateLimit');

router.get('/creators', browseCreators);
router.post('/creators', browseCreators);

router.get('/campaign/:campaignId/creators', (req, res, next) => {
  req.query.campaignId = req.params.campaignId;
  return browseCreators(req, res, next);
});

router.post('/campaign/:campaignId/recommend-influencers', recommendInfluencersForCampaign);

// Separate brand-facing media-kit API.
router.get('/media-kit/:channelId', getCreatorMediaKit);

// Backward-compatible route used by older frontend code.
router.get('/creators/:channelId/media-kit', getCreatorMediaKit);

// Explicit, credit-costing action: brand clicks "Get Real Audience Data" to
// resolve this creator on Modash and pull real gender/age/geo demographics.
// Rate-limited since each call spends a Modash API credit.
router.post('/media-kit/:channelId/fetch-real-audience', modashApiLimiter, fetchRealAudienceDemographics);

router.get('/image-proxy', proxyImage);

module.exports = router;