/**
 * meetingRoutes.js  (fixed)
 *
 * Fix: [router.post](http://router.post) was corrupted syntax —
 *      replaced with correct router.post / router.get etc.
 */
const express = require('express');
const router  = express.Router();
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
} = require('../controllers/meetingController');
const { endMeeting } = require('../controllers/aiController');
const protect = require('../middleware/authMiddleware');

// ── Meeting CRUD ──────────────────────────────────────────────────────────────
router.post('/',     protect, createMeeting);
router.post('/join', protect, joinMeeting);   // must be BEFORE /:id
router.get('/',      protect, getMeetings);
router.get('/:id',   protect, getMeetingById);
router.put('/:id',   protect, updateMeeting);
router.delete('/:id',protect, deleteMeeting);

// ── End meeting + AI summary ──────────────────────────────────────────────────
// POST /api/meetings/:id/end-meeting
// Body: { transcript: string }
router.post('/:id/end-meeting', protect, endMeeting);

module.exports = router;
