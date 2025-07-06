const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePic: String,
  followers: [String],
  following: [String]
});

module.exports = mongoose.model('User', UserSchema);
