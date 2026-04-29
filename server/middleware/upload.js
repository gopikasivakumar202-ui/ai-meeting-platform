const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../Config/Cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'intellmeet/avatars',     // folder in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill' }], // auto resize
  },
});

const upload = multer({ storage });

module.exports = upload;