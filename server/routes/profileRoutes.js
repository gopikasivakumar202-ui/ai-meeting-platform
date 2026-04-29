const express = require('express');
const { getProfile } = require('../controllers/profileController'); // correct path
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Protected route
router.get('/profile', protect, getProfile); // getProfile must be defined

module.exports = router;