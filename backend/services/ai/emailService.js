const nodemailer = require('nodemailer');

// Configure the email transporter using your .env credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Service to send OTP for password reset
 * @param {string} email - User's email address
 * @param {string} otp - Generated 6-digit code
 */
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"StudyBuddy Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verification Code - StudyBuddy',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4F46E5;">Password Reset Request</h2>
        <p>Your verification code is:</p>
        <h1 style="background: #F3F4F6; padding: 10px; display: inline-block; letter-spacing: 5px; color: #4F46E5;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP Email sent successfully to:', email);
  } catch (error) {
    console.error('Nodemailer Error:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendOTPEmail };