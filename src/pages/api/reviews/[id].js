import pool from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  // Handle GET request (get a specific review)
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT 
          r.id, 
          r.rating, 
          r.review_text, 
          r.created_at,
          r.user_id,
          r.realtor_id,
          u.username as user_name,
          rl.username as realtor_name
        FROM "review" r
        LEFT JOIN "user" u ON r.user_id = u.id
        LEFT JOIN "user" rl ON r.realtor_id = rl.id
        WHERE r.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Review not found' });
      }
      
      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching review:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Handle DELETE request (delete a review)
  if (req.method === 'DELETE') {
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

      // Check if review exists and belongs to the user or user is admin
      const checkReviewQuery = 'SELECT user_id FROM "review" WHERE id = $1';
      const checkReviewResult = await pool.query(checkReviewQuery, [id]);

      if (checkReviewResult.rows.length === 0) {
        return res.status(404).json({ message: 'Review not found' });
      }

      const review = checkReviewResult.rows[0];
      if (review.user_id !== user.id && user.user_type !== 'Admin') {
        return res.status(403).json({ message: 'You do not have permission to delete this review' });
      }

      // Delete review
      const deleteQuery = 'DELETE FROM "review" WHERE id = $1';
      await pool.query(deleteQuery, [id]);

      return res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Handle PUT request (update a review)
  if (req.method === 'PUT') {
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

      // Check if review exists and belongs to the user or user is admin
      const checkReviewQuery = 'SELECT user_id FROM "review" WHERE id = $1';
      const checkReviewResult = await pool.query(checkReviewQuery, [id]);

      if (checkReviewResult.rows.length === 0) {
        return res.status(404).json({ message: 'Review not found' });
      }

      const review = checkReviewResult.rows[0];
      if (review.user_id !== user.id && user.user_type !== 'Admin') {
        return res.status(403).json({ message: 'You do not have permission to update this review' });
      }

      const { rating, review_text } = req.body;

      // Validate rating is between 1 and 5
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Update review
      const updateQuery = `
        UPDATE "review" 
        SET rating = $1, review_text = $2 
        WHERE id = $3
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [rating, review_text || '', id]);

      return res.status(200).json({ 
        message: 'Review updated successfully', 
        review: result.rows[0] 
      });
    } catch (error) {
      console.error('Error updating review:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // If method is not supported
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}