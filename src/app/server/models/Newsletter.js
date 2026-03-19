import mongoose from 'mongoose';

// Newsletter Subscriber Schema
const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'bounced'],
    default: 'active',
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  unsubscribedAt: {
    type: Date,
    default: null,
  },
  preferenceCenter: {
    marketing: { type: Boolean, default: true },
    updates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
  },
  tags: [String],
  bounceCount: {
    type: Number,
    default: 0,
  },
  complaintCount: {
    type: Number,
    default: 0,
  },
  lastActivityDate: {
    type: Date,
    default: Date.now,
  },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Newsletter Campaign Schema
const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  htmlContent: String,
  description: String,
  campaignType: {
    type: String,
    enum: ['promotional', 'informational', 'transactional', 'announcement'],
    default: 'informational',
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'paused', 'archived'],
    default: 'draft',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  senderEmail: {
    type: String,
    default: process.env.NEWSLETTER_FROM_EMAIL || 'noreply@kiddiescheck.org',
  },
  senderName: {
    type: String,
    default: 'Kiddies Check',
  },
  recipients: {
    type: {
      type: String,
      enum: ['all', 'segment', 'list', 'individual'],
      default: 'all',
    },
    selectedSegments: [String],
    selectedTags: [String],
    selectedSubscribers: [mongoose.Schema.Types.ObjectId],
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
  }],
  scheduledFor: Date,
  sentAt: Date,
  sentCount: {
    type: Number,
    default: 0,
  },
  openCount: {
    type: Number,
    default: 0,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  bounceCount: {
    type: Number,
    default: 0,
  },
  complaintCount: {
    type: Number,
    default: 0,
  },
  unsubscribeCount: {
    type: Number,
    default: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
  },
  analytics: {
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
    unsubscribeRate: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    complaintRate: { type: Number, default: 0 },
  },
  editHistory: [{
    editedAt: Date,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changes: mongoose.Schema.Types.Mixed,
  }],
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Newsletter Template Schema
const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
  },
  description: String,
  content: {
    type: String,
    required: true,
  },
  htmlContent: String,
  thumbnailUrl: String,
  category: {
    type: String,
    enum: ['promotional', 'informational', 'announcement', 'event', 'other'],
    default: 'other',
  },
  variables: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Newsletter Activity Log Schema
const activityLogSchema = new mongoose.Schema({
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscriber',
    required: true,
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  eventType: {
    type: String,
    enum: ['sent', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'subscribed'],
    required: true,
  },
  link: String,
  userAgent: String,
  ipAddress: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// Create models
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const Template = mongoose.model('Template', templateSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export { Subscriber, Campaign, Template, ActivityLog };
