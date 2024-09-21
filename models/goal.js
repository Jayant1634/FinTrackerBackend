// models/goal.js
const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  goalType: { type: String, required: true }, // e.g., 'savings', 'budget'
  targetAmount: { type: Number, required: true },
  currentProgress: { type: Number, default: 0 },
  deadline: { type: Date },
});

module.exports = mongoose.model('Goal', GoalSchema);