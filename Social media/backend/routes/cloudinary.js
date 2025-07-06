// backend/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dl0ze3ylx',
  api_key: '764811824839999',
  api_secret: 'CBhke5-S97GlS90uJa6pK8Ndmqs'
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'InstaMini', // Optional folder name
    allowed_formats: ['jpg', 'png', 'jpeg'],
  }
});

module.exports = { cloudinary, storage };
