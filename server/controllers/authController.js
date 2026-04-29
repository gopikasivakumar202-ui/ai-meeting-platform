const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }  // ← changed from 1d to 7d
  );
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password });
    const token = generateToken(user);
    res.status(201).json({ token, name: user.name, avatar: user.avatar });
  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    const token = generateToken(user);
    res.json({
      token,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    console.log('📁 File:', req.file?.originalname, req.file?.path);
    console.log('👤 User ID:', req.user?._id);
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.path },
      { new: true }
    ).select('-password');
    res.json({ avatar: user.avatar, message: 'Avatar updated successfully' });
  } catch (err) {
    console.error('❌ Error name:', err.name);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
};

module.exports = { registerUser, loginUser, getMe, uploadAvatar };