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
  
  const { username, password, rememberMe } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username/Email and password are required' });
  }
  
  try {
    // Check if user exists by either username or email
    const userResult = await pool.query(
      'SELECT * FROM "user" WHERE username = $1 OR email = $1',
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
    
    // Return user data with explicit id field
    const { password: _, ...userData } = user;
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id, // Ensure id is included
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        ...userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}