import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

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
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  try {
    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT * FROM "user" WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    await pool.query(
      'INSERT INTO "user" (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );
    
    return res.status(201).json({
      message: 'Registration successful! Please log in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}