require('dotenv').config();
const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail email address
    pass: process.env.GMAIL_PASS, // Your Gmail app password (use an App Password, not your regular Gmail password)
  },
});

const sendOTPEmail = async (email, otp) => {
  try {
    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender address (your Gmail address)
      to: email, // Recipient email
      subject: 'Your Signup OTP',
      html: `<h2>Your Signup OTP</h2>
             <p>Thank you for signing up! Use the OTP below to complete your registration.</p>
             <h3>${otp}</h3>
             <p>If you did not request this OTP, please ignore this email.</p>
             <p> This Request will expire after <b>5 minutes</b></p>`,
    };

    // Send the email
    const response = await transporter.sendMail(mailOptions);
    console.log('Email sent:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const setForgetPassEmail = async (email, link) => {
  try {
    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender address (your Gmail address)
      to: email, // Recipient email
      subject: 'Reset Your Password',
      html: `<h2>Reset Your Password</h2>
             <p>Click the link below to reset your password.</p>
             <a href="${link}">Reset Password</a>
             <p>If you did not request this, please ignore this email.</p>
             <p> This Request will expire after <b>10 minutes</b></p>`,
    };

    // Send the email
    const response = await transporter.sendMail(mailOptions);
    console.log('Email sent:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {sendOTPEmail,setForgetPassEmail};
