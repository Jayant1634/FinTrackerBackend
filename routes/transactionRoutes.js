const express = require('express');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/user'); // Import User model

// Route to add a transaction
router.post('/', async (req, res) => {
  const { userId, category, type, amount, date } = req.body;

  // Input validation
  if (!userId || !category || !type || typeof amount !== 'number' || !date) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Invalid transaction type' });
  }

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please log in again.' });
    }

    // Create a new transaction
    const newTransaction = new Transaction({ userId, category, type, amount, date });

    // Save the new transaction
    const savedTransaction = await newTransaction.save();

    // Update user's current balance and total amount spent
    if (type === 'expense') {
      user.currentBalance -= amount;
      user.totalAmountSpent += amount;
    } else if (type === 'income') {
      user.currentBalance += amount;
      // Optionally, you can track total amount received if needed
    }

    // Save the updated user data
    await user.save();

    console.log('Transaction saved:', savedTransaction);
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ message: 'Failed to add transaction', error: error.message });
  }
});

// Route to fetch user's current balance
router.get('/balance/:userId', async (req, res) => {
  const { userId } = req.params;

  // Ensure userId is valid before querying
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ currentBalance: user.currentBalance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Failed to fetch balance', error: error.message });
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
