const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: {type: Number, unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  registrationDate: { type: Date, default: Date.now },
  lastLoginDate: { type: Date },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
});

module.exports = mongoose.model('User', userSchema);