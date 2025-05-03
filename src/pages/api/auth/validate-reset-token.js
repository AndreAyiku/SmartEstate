import pool from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const query = `
      SELECT id FROM "user" 
      WHERE reset_token = $1 
      AND reset_token_expires > NOW()
    `;
    
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    return res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Error validating reset token:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}