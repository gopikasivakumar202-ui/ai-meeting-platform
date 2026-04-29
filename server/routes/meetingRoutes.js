/**
 * meetingRoutes.js  (updated – adds Week 3 end-meeting / AI route)
 * Replace Zidio/server/routes/meetingRoutes.js with this file.
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

const { endMeeting } = require('../controllers/aiController');   // ← Week 3

const protect = require('../middleware/authMiddleware');

// ── Existing Week 1 / 2 routes ────────────────────────────────────────────────
router.post('/',     protect, createMeeting);
router.post('/join', protect, joinMeeting);   // must be BEFORE /:id
router.get('/',      protect, getMeetings);
router.get('/:id',   protect, getMeetingById);
router.put('/:id',   protect, updateMeeting);
router.delete('/:id',protect, deleteMeeting);

// ── Week 3 bridge: end meeting + trigger AI summary ───────────────────────────
// POST /api/meetings/:id/end-meeting
// Body: { transcript: string }
router.post('/:id/end-meeting', protect, endMeeting);

module.exports = router;
