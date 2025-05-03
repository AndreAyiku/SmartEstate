import pool from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  // Handle GET request (get all reviews for a realtor)
  if (req.method === 'GET') {
    try {
      // Check if the user is a realtor
      const userQuery = 'SELECT user_type FROM "user" WHERE id = $1';
      const userResult = await pool.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = userResult.rows[0];
      if (user.user_type !== 'Realtor') {
        return res.status(400).json({ message: 'User is not a realtor' });
      }

      // Count total reviews
      const countQuery = 'SELECT COUNT(*) AS total FROM "review" WHERE realtor_id = $1';
      const countResult = await pool.query(countQuery, [id]);
      const totalReviews = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalReviews / limit);

      // Get reviews with pagination
      const reviewsQuery = `
        SELECT 
          r.id, 
          r.rating, 
          r.review_text, 
          r.created_at,
          u.id as reviewer_id,
          u.username as reviewer_name,
          COALESCE(encode(u.profile_picture, 'base64'), '') as reviewer_profile_picture
        FROM "review" r
        LEFT JOIN "user" u ON r.user_id = u.id
        WHERE r.realtor_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const reviewsResult = await pool.query(reviewsQuery, [id, limit, offset]);
      
      // Process profile pictures
      const reviews = reviewsResult.rows.map(review => ({
        ...review,
        reviewer_profile_picture: review.reviewer_profile_picture 
          ? `data:image/jpeg;base64,${review.reviewer_profile_picture}` 
          : null
      }));

      // Get average rating
      const avgRatingQuery = 'SELECT COALESCE(AVG(rating), 0) as average FROM "review" WHERE realtor_id = $1';
      const avgRatingResult = await pool.query(avgRatingQuery, [id]);
      const averageRating = parseFloat(avgRatingResult.rows[0].average);

      // Get rating distribution
      const ratingDistQuery = `
        SELECT 
          rating, 
          COUNT(*) as count 
        FROM "review" 
        WHERE realtor_id = $1 
        GROUP BY rating 
        ORDER BY rating DESC
      `;
      
      const ratingDistResult = await pool.query(ratingDistQuery, [id]);
      
      const ratingDistribution = {
        5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      };
      
      ratingDistResult.rows.forEach(row => {
        ratingDistribution[row.rating] = parseInt(row.count);
      });

      return res.status(200).json({
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        stats: {
          averageRating,
          ratingDistribution
        }
      });
    } catch (error) {
      console.error('Error fetching realtor reviews:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // If method is not supported
  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}