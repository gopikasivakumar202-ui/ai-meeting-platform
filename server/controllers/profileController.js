const User = require('../models/User');
const { cloudinary } = require('../Config/Cloudinary');

// @GET /api/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, phone, department } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (phone) user.phone = phone;
    if (department) user.department = department;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      phone: updatedUser.phone,
      department: updatedUser.department,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/profile/avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`intellmeet/avatars/${publicId}`);
    }

    // Save new avatar URL
    user.avatar = req.file.path;
    await user.save();

    res.json({
      message: 'Avatar updated successfully ✅',
      avatar: user.avatar,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/profile/avatar
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.avatar) {
      const publicId = user.avatar.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`intellmeet/avatars/${publicId}`);
      user.avatar = '';
      await user.save();
    }
    res.json({ message: 'Avatar deleted successfully ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile, uploadAvatar, deleteAvatar };