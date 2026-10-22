const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String }, // Allow UUID strings as _id
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'developer' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false }); // Disable auto ObjectId since we supply our own string _id

const memoryUsers = new Map(); // email -> user

const UserModel = mongoose.model('User', userSchema);

module.exports = {
  UserModel,
  memoryUsers,
};
