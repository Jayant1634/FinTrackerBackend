// routes/predictionRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get predictions for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  // Fetch user's transactions from the database and prepare data for prediction
  // For simplicity, we'll just send a static month
  const month = new Date().getMonth() + 1; // Current month

  try {
    const response = await axios.post('http://localhost:5001/predict', { month });
    res.json([response.data]); // Return as an array for frontend compatibility
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

module.exports = router;