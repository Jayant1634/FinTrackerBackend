// routes/userRoutes.js
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const sendOTPEmail = require('../email');


var tempOTP = {};
/*
{
"anand@gmail.com" : {
"otp" : "123456",
"timeout" : 1234567890
}
}

*/

// Password hashing function
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// User Registration
router.post('/register', async (req, res) => {
  const { name, username, password ,email} = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  sendOTPEmail(email, otp);

  //add timestamp of +15 minutes
  tempOTP[email] = { otp, timeout: Date.now() + 15 * 60 * 1000,userData:{ name, username, password} };

  //rate limiting of generation of otp
  if(tempOTP[email].timeout > Date.now()){
    return res.status(400).json({ message: 'OTP already sent' });
  }

  console.log(tempOTP);
  
});


const clearOLDOtp = () => {
  for (const email in tempOTP) {
    if (tempOTP[email].timeout < Date.now()) {
      delete tempOTP[email];
    }
  }
};

router.post('verify-otp',async (req,res) => {

  clearOLDOtp();

  try {
    // Check if user already exists
    const { email,otp } = req.body;

    if(!tempOTP[email]){
      return res.status(400).json({ message: 'Please Generate OTP first' });
    }

    if(tempOTP[email].otp !== otp){
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a new user with name
    const newUser = new User(tempOTP[email].userData);
    await newUser.save();

    res.status(201).json({ id: newUser._id, username: newUser.username, name: newUser.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});


// User Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Attempting to log in with:', username);

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If everything is okay, send user data (omit password)
    res.status(200).json({ id: user._id, username: user.username, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Balance
router.post('/updateBalance', async (req, res) => {
  const { userId, amount } = req.body; // Expecting userId and amount in the request body

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.currentBalance += amount; // Update current balance
    await user.save(); // Save the updated user

    res.status(200).json({ currentBalance: user.currentBalance }); // Return updated balance
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/getBalance/:userId', async (req, res) => {
  const { userId } = req.params; // Get the userId from the request parameters

  try {
    const user = await User.findById(userId); // Find the user by ID
    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // If user not found, return a 404 response
    }

    res.status(200).json({ currentBalance: user.currentBalance }); // Return the user's current balance
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' }); // Handle server errors
  }
});


module.exports = router;