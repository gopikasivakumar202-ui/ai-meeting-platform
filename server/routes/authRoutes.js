const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, uploadAvatar } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { upload } = require('../config/Cloudinary');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;