import pool from '../../../lib/db';

export default async function handler(req, res) {
  // Handle POST request (create new review)
  if (req.method === 'POST') {
    try {
      // Get user from authorization header
      const userString = req.headers.authorization?.split(' ')[1];
      let user;

      try {
        if (!userString) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        user = JSON.parse(Buffer.from(userString, 'base64').toString());
      } catch (error) {
        return res.status(401).json({ message: 'Invalid authentication' });
      }

      const { realtor_id, rating, review_text } = req.body;

      // Validate required fields
      if (!realtor_id || !rating) {
        return res.status(400).json({ message: 'Realtor ID and rating are required' });
      }

      // Validate rating is between 1 and 5
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Check if realtor exists and is actually a realtor
      const checkRealtorQuery = 'SELECT id, user_type FROM "user" WHERE id = $1';
      const checkRealtorResult = await pool.query(checkRealtorQuery, [realtor_id]);

      if (checkRealtorResult.rows.length === 0) {
        return res.status(404).json({ message: 'Realtor not found' });
      }

      const realtor = checkRealtorResult.rows[0];
      if (realtor.user_type !== 'Realtor') {
        return res.status(400).json({ message: 'Selected user is not a realtor' });
      }

      // Prevent users from reviewing themselves
      if (user.id === parseInt(realtor_id)) {
        return res.status(400).json({ message: 'You cannot review yourself' });
      }

      // Check if user has already reviewed this realtor
      const checkExistingQuery = 'SELECT id FROM "review" WHERE user_id = $1 AND realtor_id = $2';
      const checkExistingResult = await pool.query(checkExistingQuery, [user.id, realtor_id]);

      if (checkExistingResult.rows.length > 0) {
        return res.status(400).json({ message: 'You have already reviewed this realtor' });
      }

      // Insert new review
      const insertQuery = `
        INSERT INTO "review" (user_id, realtor_id, rating, review_text, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `;
      
      const result = await pool.query(insertQuery, [user.id, realtor_id, rating, review_text || '']);
      const newReview = result.rows[0];

      return res.status(201).json({ 
        message: 'Review submitted successfully', 
        reviewId: newReview.id 
      });

    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Handle GET request (get all reviews)
  if (req.method === 'GET') {
    try {
      const { limit = 10, offset = 0 } = req.query;
      
      const query = `
        SELECT 
          r.id, 
          r.rating, 
          r.review_text, 
          r.created_at,
          r.user_id,
          r.realtor_id,
          u.username as user_name
        FROM "review" r
        LEFT JOIN "user" u ON r.user_id = u.id
        ORDER BY r.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // If method is not supported
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}