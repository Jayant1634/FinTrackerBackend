// routes/goalRoutes.js
const express = require('express');
const router = express.Router();
const Goal = require('../models/goal');

// Add a new financial goal
router.post('/', async (req, res) => {
  const { userId, goalType, targetAmount, deadline } = req.body;

  try {
    const goal = new Goal({ userId, goalType, targetAmount, deadline });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get goals for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const goals = await Goal.find({ userId });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;