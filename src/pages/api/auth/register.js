import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import formidable from 'formidable';
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
  
  const form = new formidable.IncomingForm();
  
  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });
    
    const { username, password, email, userType } = fields;
    
    if (!username || !password || !email || !userType) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if username or email already exists
    const existingUser = await pool.query(
      'SELECT * FROM "user" WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      if (existingUser.rows[0].username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      } else {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    let profilePicture = null;
    
    // Process profile picture if provided
    if (files.profilePicture && files.profilePicture.size > 0) {
      const fileData = await readFile(files.profilePicture.filepath);
      profilePicture = fileData;
    }
    
    // Create new user
    await pool.query(
      'INSERT INTO "user" (username, password, email, user_type, profile_picture) VALUES ($1, $2, $3, $4, $5)',
      [username, hashedPassword, email, userType, profilePicture]
    );
    
    return res.status(201).json({
      message: 'Registration successful! Please log in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}