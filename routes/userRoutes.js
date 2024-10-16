// routes/userRoutes.js
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const {sendOTPEmail,setForgetPassEmail} = require('../email_appscripts');
// const {sendOTPEmail,setForgetPassEmail} = require('../email');  purane wala


var tempOTP = {};
/*
{
"anand@gmail.com" :  {
        "otp" : "123456",
        "timeout" : 1234567890
        }
}
*/

var forgetTimeout = new Map();

/*

"ahashketaidsaodadi" :  {
        "email" : "123456",
        "timeout" : 1234567890
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

      
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  sendOTPEmail(email, otp);

  //add timestamp of +15 minutes
  tempOTP[email] = { otp, timeout: Date.now() + 15 * 60 * 1000, name,password,email,username };

  //rate limiting of generation of otp
  if(tempOTP[email].timeout <= Date.now()){
    return res.status(400).json({ message: 'OTP already sent' });
  }

  console.log(tempOTP[email]);
  return res.status(200).json({ message: 'OTP sent' });  

});


const clearOLDOtp = () => {
  for (const email in tempOTP) {
    if (tempOTP[email].timeout < Date.now()) {
      delete tempOTP[email];
    }
  }
};

const clearOLDResets = () => {
  for (const hash in forgetTimeout) {
    if (forgetTimeout[hash].timeout < Date.now()) {
      delete forgetTimeout[hash];
    }
  }
};


router.post('/resend-otp',async (req, res) => {

  clearOLDOtp();

  try {
    // Check if user already exists
    const { email } = req.body;

    if(!tempOTP[email]){
      return res.status(400).json({ message: 'Please Generate OTP first' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    sendOTPEmail(email, otp);

    tempOTP[email].otp = otp;
    tempOTP[email].timeout = Date.now() + 5 * 60 * 1000;

    console.log(tempOTP[email]);
    return res.status(200).json({ message: 'OTP sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

router.post('/verify-otp',async (req,res) => {

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

    // Hash the password
     tempOTP[email].password = await hashPassword(  tempOTP[email].password );

    // Create a new user with name
    const newUser = new User(tempOTP[email]);
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


router.post('/forgot-password',async (req, res) => {
  clearOLDResets();

  
  const { email } = req.body;
  
  for (let [hashKey, v] of forgetTimeout) {
    if(v.email == email ){
      return res.status(400).json({ message: 'Reset link already sent' });
    }
  }

  try {
    // Check if user already exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    var seed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var hashKey = await hashPassword( process.env.SALT_PASS_FORGET + email  + seed);

    forgetTimeout[hashKey] = { email, timeout: Date.now() + 10 * 60 * 1000 };

    var link = process.env.FRONTEND_URL + '/reset-password?token=' + encodeURIComponent(hashKey);
    setForgetPassEmail(email, link);

    return res.status(200).json({ message: 'Reset link sent' });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password',async (req, res) => {
  clearOLDResets();

  const { token, password } = req.body;

  try {
    // Check if user already exists
    var hashKey = token;
    if(!forgetTimeout[hashKey]){
      return res.status(400).json({ message: 'Invalid token' });
    }

    if(forgetTimeout[hashKey].timeout <= Date.now()){
      return res.status(400).json({ message: 'Token expired' });
    }

    var user = await User.findOne({ email: forgetTimeout[hashKey].email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    user.password = await hashPassword( password );
    await user.save();

    await delete forgetTimeout[hashKey];

    res.status(200).json({ message: 'Password reset successful' });
  }
  catch (error) {
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