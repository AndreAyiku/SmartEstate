import pool from '../../../lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configure email transport (using environment variables in production)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-password',
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if user exists
    const userQuery = 'SELECT id, username FROM "user" WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    // Note: We don't tell the client if the email exists or not for security reasons
    if (userResult.rows.length === 0) {
      // For security, still return 200 to prevent email enumeration
      return res.status(200).json({ message: 'If your email is registered, you will receive a reset link shortly' });
    }

    const user = userResult.rows[0];
    
    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration (1 hour from now)
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1);

    // Save the token in the database
    await pool.query(
      'UPDATE "user" SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, tokenExpires, user.id]
    );

    // Construct the password reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send the email
    const mailOptions = {
      from: `"SmartEstate" <${process.env.EMAIL_FROM || 'noreply@smartestate.com'}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e65100;">Reset Your Password</h2>
          <p>Hello ${user.username},</p>
          <p>We received a request to reset your password for your SmartEstate account. To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #e65100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Thank you,<br>The SmartEstate Team</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
          <p style="font-size: 12px; color: #666; word-break: break-all;">${resetUrl}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    // Send success response to client
    return res.status(200).json({
      message: 'If your email is registered, you will receive a reset link shortly'
    });
  } catch (error) {
    console.error('Error in forgot password flow:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}