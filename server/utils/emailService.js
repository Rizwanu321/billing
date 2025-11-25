// server/utils/emailService.js
const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or use 'smtp.gmail.com' with port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
  },
});

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: {
      name: "BillTrack Pro",
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: "Password Reset OTP - BillTrack Pro",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">BillTrack Pro</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Billing Made Simple</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
              You have requested to reset your password. Use the following One-Time Password (OTP) to verify your identity:
            </p>

            <!-- OTP Box -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Important:</strong> This OTP will expire in 5 minutes. Do not share this code with anyone.
              </p>
            </div>

            <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; font-size: 14px;">
              If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              © 2025 BillTrack Pro. All rights reserved.
            </p>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">
              Need help? Contact us at support@billtrackpro.com
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendOTPEmail };
