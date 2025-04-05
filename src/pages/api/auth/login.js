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
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM "user" WHERE username = $1',
      [username]
    );
    
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    
    return res.status(200).json({
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}