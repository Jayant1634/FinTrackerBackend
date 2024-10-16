const axios = require('axios');
require('dotenv').config();

// Web App URL from Google Apps Script
const GOOGLE_APPS_SCRIPT_URL = process.env.MAIL_SCRIPT;

const sendOTPEmail = async (email, otp) => {
  try {
    // Call the Google Apps Script web app to send the OTP email
    const response = await axios.post(GOOGLE_APPS_SCRIPT_URL, {
      action: 'sendOTPEmail',
      email,
      otp,
    });

    if (response.data.status === 'success') {
      console.log('OTP email sent successfully');
    } else {
      console.error('Error sending OTP email:', response.data);
    }
  } catch (error) {
    console.error('Error calling Google Apps Script:', error);
  }
};

const setForgetPassEmail = async (email, link) => {
  try {
    // Call the Google Apps Script web app to send the password reset email
    const response = await axios.post(GOOGLE_APPS_SCRIPT_URL, {
      action: 'setForgetPassEmail',
      email,
      link,
    });

    if (response.data.status === 'success') {
      console.log('Password reset email sent successfully');
    } else {
      console.error('Error sending password reset email:', response.data);
    }
  } catch (error) {
    console.error('Error calling Google Apps Script:', error);
  }
};

module.exports = { sendOTPEmail, setForgetPassEmail };
