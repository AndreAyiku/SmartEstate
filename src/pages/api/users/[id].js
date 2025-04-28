// File: pages/api/users/[id].js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    // Validate that id is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Query to get user details - removed phone field that doesn't exist
    const userQuery = `
      SELECT 
        u.id, 
        u.username AS name, 
        u.email, 
        u.user_type,
        u.bio,
        encode(u.profile_picture, 'base64') as profile_picture_base64
      FROM "user" u
      WHERE u.id = $1
    `;
    
    const userResult = await pool.query(userQuery, [id]);
    
    // Update the response formatting
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const formattedUser = {
      ...user,
      profile_picture: user.profile_picture_base64 
        ? `data:image/jpeg;base64,${user.profile_picture_base64}` 
        : null,
    };

    // If user is a realtor, get additional realtor-specific data
    if (user.user_type === 'Realtor') {
      // Query to get realtor reviews
      const reviewsQuery = `
        SELECT 
          r.id,
          r.rating,
          r.review_text,
          r.created_at,
          u.username AS reviewer_name
        FROM "review" r
        LEFT JOIN "user" u ON r.user_id = u.id
        WHERE r.realtor_id = $1
        ORDER BY r.created_at DESC
      `;
      
      const reviewsResult = await pool.query(reviewsQuery, [id]);
      formattedUser.reviews = reviewsResult.rows;
      
      // Query to count total properties by this realtor
      const propertiesCountQuery = `
        SELECT COUNT(*) AS total_properties
        FROM "property"
        WHERE realtor_id = $1
      `;
      
      const propertiesCountResult = await pool.query(propertiesCountQuery, [id]);
      formattedUser.totalProperties = parseInt(propertiesCountResult.rows[0].total_properties);
      
      // Query to get total sales (properties with status 'Sold')
      const salesCountQuery = `
        SELECT COUNT(*) AS total_sales
        FROM "property"
        WHERE realtor_id = $1 AND status = 'Sold'
      `;
      
      const salesCountResult = await pool.query(salesCountQuery, [id]);
      formattedUser.totalSales = parseInt(salesCountResult.rows[0].total_sales);
      
      // Query to get average rating
      const ratingQuery = `
        SELECT COALESCE(AVG(rating), 0) AS average_rating
        FROM "review"
        WHERE realtor_id = $1
      `;
      
      const ratingResult = await pool.query(ratingQuery, [id]);
      formattedUser.averageRating = parseFloat(ratingResult.rows[0].average_rating);
    } else {
      // For regular users, get their favorites count
      const favoritesCountQuery = `
        SELECT COUNT(*) AS total_favorites
        FROM "user_favorite"
        WHERE user_id = $1
      `;
      
      const favoritesCountResult = await pool.query(favoritesCountQuery, [id]);
      formattedUser.totalFavorites = parseInt(favoritesCountResult.rows[0].total_favorites);
      
      // Get count of property viewings
      const viewingsCountQuery = `
        SELECT COUNT(*) AS total_viewings
        FROM "property_viewing"
        WHERE user_id = $1
      `;
      
      const viewingsCountResult = await pool.query(viewingsCountQuery, [id]);
      formattedUser.totalViewings = parseInt(viewingsCountResult.rows[0].total_viewings);
    }
    
    // Return the combined user data
    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
}