'use strict';

const crypto = require('crypto');
const CampaignReport = require('../models/campaignReport');
const { ytFetch, YT_VIDEOS } = require('./youtubeData.controller');

let saveErrorLog = async () => {};
try {
  saveErrorLog = require('../services/errorLog.service');
} catch (_) {}

const REFRESH_LIMIT_PER_WINDOW = 3;
const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

function cleanStr(value) {
  return String(value || '').trim();
}

function extractVideoId(url) {
  const value = cleanStr(url);
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

function parseIso8601DurationSeconds(duration) {
  const match = String(duration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// Same duration-bucket retention heuristic used elsewhere in this codebase
// (youtubeInsight.service.js buildPerformanceEstimates) for the single-video
// Insight OS report — kept consistent so "estimated watch time" means the
// same thing across both features. Real watch time requires YouTube
// Analytics OAuth, which this app does not have.
function estimateWatchTimeMinutes({ views, durationSeconds, likes, comments }) {
  const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
  const durationFactor =
    durationSeconds <= 60 ? 0.58 :
    durationSeconds <= 180 ? 0.46 :
    durationSeconds <= 600 ? 0.36 :
    durationSeconds <= 1200 ? 0.28 : 0.22;
  const retentionRate = Math.max(8, Math.min(82, durationFactor * 100 + engagementRate * 0.9));
  const averageViewDurationSeconds = Math.round(durationSeconds * retentionRate / 100);
  return Math.round((views * averageViewDurationSeconds) / 60);
}

async function fetchVideoStats(videoId) {
  const params = new URLSearchParams({ part: 'snippet,statistics,contentDetails', id: videoId });
  const json = await ytFetch(YT_VIDEOS, params);
  const item = json?.items?.[0];
  if (!item) {
    const err = new Error('Video not found on YouTube');
    err.status = 404;
    throw err;
  }

  const stats = item.statistics || {};
  const views = Number(stats.viewCount || 0);
  const likes = Number(stats.likeCount || 0);
  const comments = Number(stats.commentCount || 0);
  const durationSeconds = parseIso8601DurationSeconds(item.contentDetails?.duration);

  return {
    title: item.snippet?.title || '',
    channelTitle: item.snippet?.channelTitle || '',
    views,
    likes,
    comments,
    estimatedWatchTimeMinutes: estimateWatchTimeMinutes({ views, durationSeconds, likes, comments }),
  };
}

async function buildOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const OpenAI = require('openai');
    return new OpenAI({ apiKey });
  } catch (_) {
    return null;
  }
}

function buildCampaignAiFallback({ creatorName, campaignTitle, latest, growth, snapshotCount }) {
  const engagementRate = latest.views > 0 ? ((latest.likes + latest.comments) / latest.views) * 100 : 0;
  return {
    source: 'fallback',
    summary: `${campaignTitle || 'This campaign'} with ${creatorName || 'the creator'} has reached ${latest.views.toLocaleString('en-US')} views and ${latest.likes.toLocaleString('en-US')} likes so far, with an engagement rate of ${engagementRate.toFixed(2)}%. Estimated watch time is ${latest.estimatedWatchTimeMinutes.toLocaleString('en-US')} minutes — a public-data estimate, not real YouTube Analytics.`,
    recommendation: snapshotCount < 2
      ? 'Refresh again later to start building a performance trend.'
      : growth > 0
        ? 'Views are growing since the last snapshot — performance trending positively.'
        : 'Views have plateaued since the last snapshot — consider re-promoting or wrapping the campaign.',
  };
}

// Optional AI enrichment (works without OPENAI_API_KEY — degrades to a plain
// numbers-based summary, never a mismatched or fabricated narrative).
async function buildAiSummaryForReport(report) {
  const latest = report.snapshots[report.snapshots.length - 1];
  const first = report.snapshots[0];
  const growth = latest.views - first.views;
  const context = {
    creatorName: report.creatorName,
    campaignTitle: report.campaignTitle,
    latest,
    growth,
    snapshotCount: report.snapshots.length,
  };

  const fallback = buildCampaignAiFallback(context);
  const client = await buildOpenAiClient();
  if (!client) return fallback;

  try {
    const model = process.env.OPENAI_YOUTUBE_INSIGHT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a brand marketing analyst. Use only the provided public campaign numbers. Do not invent private analytics, demographics, or revenue. Return JSON only: {"summary":"","recommendation":""}',
        },
        { role: 'user', content: JSON.stringify(context) },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    return {
      source: 'openai',
      summary: String(parsed.summary || '').trim() || fallback.summary,
      recommendation: String(parsed.recommendation || '').trim() || fallback.recommendation,
    };
  } catch (err) {
    return fallback;
  }
}

async function createCampaignReport(req, res) {
  try {
    const { pitchFolderItemId, videoUrl, campaignId, campaignTitle, creatorName } = req.body || {};
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      return res.status(400).json({ success: false, error: 'A valid YouTube video URL is required' });
    }

    const stats = await fetchVideoStats(videoId);

    const report = new CampaignReport({
      pitchFolderItemId: pitchFolderItemId || null,
      campaignId: cleanStr(campaignId),
      campaignTitle: cleanStr(campaignTitle),
      creatorName: cleanStr(creatorName) || stats.channelTitle,
      videoUrl: cleanStr(videoUrl),
      videoId,
      snapshots: [{
        capturedAt: new Date(),
        views: stats.views,
        likes: stats.likes,
        comments: stats.comments,
        estimatedWatchTimeMinutes: stats.estimatedWatchTimeMinutes,
      }],
      refreshCount: 0,
      refreshWindowStart: new Date(),
      shareToken: crypto.randomBytes(24).toString('base64url'),
    });

    report.aiSummary = await buildAiSummaryForReport(report);
    await report.save();

    const baseUrl = cleanStr(process.env.CAMPAIGN_BASE_URL || process.env.ADMIN_APP_URL || 'http://localhost:3000');
    const link = `${baseUrl}/campaign-report/${report.shareToken}`;

    return res.status(201).json({ success: true, data: { reportId: String(report._id), link } });
  } catch (err) {
    await saveErrorLog(req, err, err?.status || 500, 'CAMPAIGN_REPORT_CREATE');
    return res.status(err?.status || 500).json({ success: false, error: err?.message || 'Failed to create campaign report' });
  }
}

async function listCampaignReports(req, res) {
  try {
    const reports = await CampaignReport.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const baseUrl = cleanStr(process.env.CAMPAIGN_BASE_URL || process.env.ADMIN_APP_URL || 'http://localhost:3000');

    const data = reports.map((report) => {
      const latest = report.snapshots?.[report.snapshots.length - 1] || null;
      const now = Date.now();
      const windowStart = new Date(report.refreshWindowStart).getTime();
      const windowExpired = now - windowStart >= REFRESH_WINDOW_MS;
      const refreshesRemaining = windowExpired ? REFRESH_LIMIT_PER_WINDOW : Math.max(0, REFRESH_LIMIT_PER_WINDOW - report.refreshCount);

      return {
        reportId: String(report._id),
        campaignTitle: report.campaignTitle,
        creatorName: report.creatorName,
        videoUrl: report.videoUrl,
        link: `${baseUrl}/campaign-report/${report.shareToken}`,
        totalViews: latest?.views ?? null,
        totalLikes: latest?.likes ?? null,
        snapshotCount: report.snapshots?.length || 0,
        refreshesRemaining,
        createdAt: report.createdAt,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    await saveErrorLog(req, err, 500, 'CAMPAIGN_REPORT_LIST');
    return res.status(500).json({ success: false, error: 'Failed to load campaign reports' });
  }
}

function serializeReport(report) {
  const now = Date.now();
  const windowStart = new Date(report.refreshWindowStart).getTime();
  const windowExpired = now - windowStart >= REFRESH_WINDOW_MS;
  const refreshesRemaining = windowExpired ? REFRESH_LIMIT_PER_WINDOW : Math.max(0, REFRESH_LIMIT_PER_WINDOW - report.refreshCount);
  const nextRefreshAvailableAt = windowExpired || refreshesRemaining > 0 ? null : new Date(windowStart + REFRESH_WINDOW_MS).toISOString();

  const latest = report.snapshots[report.snapshots.length - 1] || null;

  return {
    campaignTitle: report.campaignTitle,
    creatorName: report.creatorName,
    videoUrl: report.videoUrl,
    snapshots: report.snapshots,
    hasTrend: report.snapshots.length >= 2,
    summary: latest ? {
      totalViews: latest.views,
      totalLikes: latest.likes,
      totalComments: latest.comments,
      estimatedWatchTimeMinutes: latest.estimatedWatchTimeMinutes,
    } : null,
    aiSummary: report.aiSummary,
    refreshesRemaining,
    nextRefreshAvailableAt,
  };
}

async function getPublicCampaignReport(req, res) {
  try {
    const token = cleanStr(req.params.token);
    const report = await CampaignReport.findOne({ shareToken: token, isActive: true });
    if (!report) return res.status(404).json({ success: false, error: 'Campaign report not found' });

    return res.status(200).json({ success: true, data: serializeReport(report) });
  } catch (err) {
    await saveErrorLog(req, err, err?.status || 500, 'CAMPAIGN_REPORT_PUBLIC_GET');
    return res.status(500).json({ success: false, error: 'Failed to load campaign report' });
  }
}

async function refreshCampaignReport(req, res) {
  try {
    const token = cleanStr(req.params.token);
    const report = await CampaignReport.findOne({ shareToken: token, isActive: true });
    if (!report) return res.status(404).json({ success: false, error: 'Campaign report not found' });

    const now = Date.now();
    const windowStart = new Date(report.refreshWindowStart).getTime();
    if (now - windowStart >= REFRESH_WINDOW_MS) {
      report.refreshCount = 0;
      report.refreshWindowStart = new Date();
    }

    if (report.refreshCount >= REFRESH_LIMIT_PER_WINDOW) {
      const nextAt = new Date(new Date(report.refreshWindowStart).getTime() + REFRESH_WINDOW_MS);
      return res.status(429).json({
        success: false,
        error: `Refresh limit reached (${REFRESH_LIMIT_PER_WINDOW} per 24h). Try again after ${nextAt.toISOString()}.`,
        nextRefreshAvailableAt: nextAt.toISOString(),
      });
    }

    const stats = await fetchVideoStats(report.videoId);
    report.snapshots.push({
      capturedAt: new Date(),
      views: stats.views,
      likes: stats.likes,
      comments: stats.comments,
      estimatedWatchTimeMinutes: stats.estimatedWatchTimeMinutes,
    });
    report.refreshCount += 1;
    report.aiSummary = await buildAiSummaryForReport(report);
    await report.save();

    return res.status(200).json({ success: true, data: serializeReport(report) });
  } catch (err) {
    await saveErrorLog(req, err, err?.status || 500, 'CAMPAIGN_REPORT_REFRESH');
    return res.status(err?.status || 500).json({ success: false, error: err?.message || 'Failed to refresh campaign report' });
  }
}

module.exports = {
  createCampaignReport,
  listCampaignReports,
  getPublicCampaignReport,
  refreshCampaignReport,
};
