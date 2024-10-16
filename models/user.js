// models/user.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true }, // Using username instead of email
  email : { type: String, required: true, unique: true},
  password: { type: String, required: true },
  currentBalance: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  bankAccount: { type: String },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;