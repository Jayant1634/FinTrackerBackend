// routes/transactionRoutes.js
const express = require('express');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user'); // Import User model

// Route to add a transaction
router.post('/', async (req, res) => {
  const { userId, category, amount, date } = req.body;

  // Input validation
  if (!userId || !category || typeof amount !== 'number' || !date) {
    return res.status(400).json({ message: 'Invalid input data' });
  }
  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found. Please log in again.' });
  }

  const newTransaction = new Transaction({ userId, category, amount, date });

  try {
    // Save the transaction
    const savedTransaction = await newTransaction.save();

    // Update user's current balance
    await User.findByIdAndUpdate(userId, { $inc: { currentBalance: amount } });

    console.log('Transaction saved:', savedTransaction);
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ message: 'Failed to add transaction', error: error.message });
  }
});

// Route to fetch transactions for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  // Ensure userId is valid before querying
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const transactions = await Transaction.find({ userId });
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

module.exports = router;