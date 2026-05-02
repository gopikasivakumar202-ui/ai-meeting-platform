const Meeting = require('../models/Meeting');

// ✅ Create Meeting
const createMeeting = async (req, res) => {
  try {
    const { title, description, startTime } = req.body;

    const meeting = await Meeting.create({
      title,
      description,
      host: req.user._id,
      startTime: startTime || Date.now(),
      // ✅ FIX: Add host as first participant automatically
      participants: [{ user: req.user._id }],
    });

    res.status(201).json(meeting);
  } catch (err) {
    console.error('Create Meeting Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get All Meetings for logged in user
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ]
    }).populate('host', 'name avatar').sort({ createdAt: -1 });

    res.json(meetings);
  } catch (err) {
    console.error('Get Meetings Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Single Meeting by ID
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name avatar')
      .populate('participants.user', 'name avatar');

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    res.json(meeting);
  } catch (err) {
    console.error('Get Meeting Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Meeting
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can update meeting' });
    }

    const updated = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );

    res.json(updated);
  } catch (err) {
    console.error('Update Meeting Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete Meeting
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can delete meeting' });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted successfully' });
  } catch (err) {
    console.error('Delete Meeting Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Join Meeting by Code
const joinMeeting = async (req, res) => {
  try {
    const { meetingCode } = req.body;
    const meeting = await Meeting.findOne({ meetingCode });

    if (!meeting) return res.status(404).json({ message: 'Invalid meeting code' });
    if (meeting.status === 'ended') return res.status(400).json({ message: 'Meeting has ended' });

    // ✅ Add participant if not already joined
    const alreadyJoined = meeting.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      meeting.participants.push({ user: req.user._id });
      await meeting.save();
    }

    res.json(meeting);
  } catch (err) {
    console.error('Join Meeting Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createMeeting, getMeetings, getMeetingById, updateMeeting, deleteMeeting, joinMeeting };