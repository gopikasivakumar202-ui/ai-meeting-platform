const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  }],
  meetingCode: { type: String, unique: true },
  status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'scheduled' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  recordingUrl: { type: String, default: '' },
  aiSummary: { type: String, default: '' },
  actionItems: [{ type: String }],
}, { timestamps: true });

// ✅ No next — same fix as User.js
meetingSchema.pre('save', async function () {
  if (!this.meetingCode) {
    this.meetingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
});

module.exports = mongoose.model('Meeting', meetingSchema);