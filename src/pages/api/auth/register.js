import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { formidable } from 'formidable';
import fs from 'fs';
import { promisify } from 'util';

// Convert fs.readFile to Promise-based
const readFile = promisify(fs.readFile);

export const config = {
  api: {
    bodyParser: false,
  },
};

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: 'postgresql://postgres:QiyiDzYtk3XnH0bQ@nimbly-vaulting-courser.data-1.use1.tembo.io:5432/postgres',
  ssl: {
    rejectUnauthorized: false,
    mode: 'prefer'
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Initialize formidable with options
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit for profile pictures
  });

  try {
    // Parse the form using the new API
    const [fields, files] = await form.parse(req);
    
    // Extract form data (note: fields are now arrays in formidable v3)
    const username = fields.username ? fields.username[0] : undefined;
    const password = fields.password ? fields.password[0] : undefined;
    const email = fields.email ? fields.email[0] : undefined;
    const userType = fields.userType ? fields.userType[0] : undefined;
    const phoneNumber = fields.phoneNumber ? fields.phoneNumber[0] : undefined; // Extract phone number

    if (!username || !password || !email || !userType || !phoneNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username, email, or phone number already exists
    const existingUser = await pool.query(
      'SELECT * FROM "user" WHERE username = $1 OR email = $2 OR phone_number = $3',
      [username, email, phoneNumber]
    );

    if (existingUser.rows.length > 0) {
      if (existingUser.rows[0].username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      } else if (existingUser.rows[0].email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      } else if (existingUser.rows[0].phone_number === phoneNumber) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let profilePicture = null;

    // Process profile picture if provided (files structure is different in v3)
    const profilePicFile = files.profilePicture ? files.profilePicture[0] : null;
    if (profilePicFile && profilePicFile.size > 0) {
      const fileData = await readFile(profilePicFile.filepath);
      profilePicture = fileData;
    }

    // Create new user with phone number
    await pool.query(
      'INSERT INTO "user" (username, password, email, user_type, profile_picture, phone_number) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, hashedPassword, email, userType, profilePicture, phoneNumber]
    );

    return res.status(201).json({
      message: 'Registration successful! Please log in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}