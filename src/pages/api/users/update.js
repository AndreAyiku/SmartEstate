import pool from '../../../lib/db';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import util from 'util';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const readFile = util.promisify(fs.readFile);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data including file uploads
    const form = new IncomingForm();
    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    
    // Extract user data from fields
    const userId = fields.userId[0];
    const username = fields.username[0];
    const email = fields.email[0];
    const bio = fields.bio[0];
    const phoneNumber = fields.phoneNumber ? fields.phoneNumber[0] : null;
    
    // Verify the user's identity/authorization (basic check)
    // In a real app, you would have proper authentication middleware
    const requestUserId = req.headers['user-id'];
    if (requestUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Start with base update query without profile picture
    let query = `
      UPDATE "user"
      SET 
        username = $1,
        email = $2,
        bio = $3,
        phone_number = $4
    `;
    
    let queryParams = [username, email, bio, phoneNumber];
    let paramIndex = 5; // Next parameter index
    
    // Check if a new profile picture was uploaded
    if (files.profilePicture) {
      const file = files.profilePicture[0];
      const fileData = await readFile(file.filepath);
      
      // Add profile picture to query
      query += `, profile_picture = $${paramIndex}`;
      queryParams.push(fileData);
      paramIndex++;
    }
    
    // Complete the query
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    queryParams.push(userId);
    
    // Execute the update
    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return success response with updated user data (without sensitive info)
    const updatedUser = result.rows[0];
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        user_type: updatedUser.user_type,
        bio: updatedUser.bio,
        phone_number: updatedUser.phone_number
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle unique constraint violations separately
    if (error.code === '23505') {
      if (error.constraint === 'user_username_key') {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      if (error.constraint === 'user_email_key') {
        return res.status(400).json({ error: 'Email is already in use' });
      }
      if (error.constraint === 'user_phone_number_unique') {
        return res.status(400).json({ error: 'Phone number is already in use' });
      }
    }
    
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}