'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const SnapshotSchema = new Schema(
  {
    capturedAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    estimatedWatchTimeMinutes: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampaignReportSchema = new Schema(
  {
    pitchFolderItemId: { type: Schema.Types.ObjectId, default: null, index: true },
    campaignId: { type: String, trim: true, default: '' },
    campaignTitle: { type: String, trim: true, default: '' },
    creatorName: { type: String, trim: true, default: '' },

    videoUrl: { type: String, trim: true, required: true },
    videoId: { type: String, trim: true, required: true, index: true },

    snapshots: { type: [SnapshotSchema], default: [] },

    // Rolling 24h refresh window — reset once refreshWindowStart is >24h old.
    refreshCount: { type: Number, default: 0 },
    refreshWindowStart: { type: Date, default: Date.now },

    aiSummary: { type: Schema.Types.Mixed, default: null },

    shareToken: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CampaignReport', CampaignReportSchema);
