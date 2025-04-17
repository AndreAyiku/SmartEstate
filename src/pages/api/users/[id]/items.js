// File: pages/api/users/[id]/items.js
import pool from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 6; // Number of items per page
  const offset = (page - 1) * limit;
  
  try {
    // Validate that id is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // First, check if the user is a realtor
    const userTypeQuery = `
      SELECT user_type FROM "user" WHERE id = $1
    `;
    
    const userTypeResult = await pool.query(userTypeQuery, [id]);
    
    if (userTypeResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userType = userTypeResult.rows[0].user_type;
    
    // Different queries based on user type
    if (userType === 'Realtor') {
      // For realtors, get their properties
      
      // Query to count total properties by this realtor
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM "property"
        WHERE realtor_id = $1
      `;
      
      const countResult = await pool.query(countQuery, [id]);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      
      // Query to get properties by this realtor with pagination
      const propertiesQuery = `
        SELECT 
          p.id,
          p.title,
          p.price,
          p.location,
          p.bedrooms,
          p.bathrooms,
          CONCAT(p.area, ' sq ft') AS area,
          p.property_type AS type,
          p.status,
          CASE 
            WHEN pi.id IS NOT NULL THEN CONCAT('/api/image/property/', pi.id)
            ELSE '/images/placeholder-property.jpg'
          END AS image
        FROM "property" p
        LEFT JOIN (
          SELECT DISTINCT ON (property_id) id, property_id
          FROM "property_image"
          WHERE is_primary = true
          ORDER BY property_id, id
        ) pi ON p.id = pi.property_id
        WHERE p.realtor_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const propertiesResult = await pool.query(propertiesQuery, [id, limit, offset]);
      
      // Format property prices with currency
      const properties = propertiesResult.rows.map(property => {
        return {
          ...property,
          price: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(property.price)
        };
      });
      
      res.status(200).json({
        items: properties,
        itemType: 'properties',
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } else {
      // For regular users, get their favorite properties
      
      // Query to count total favorites by this user
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM "user_favorite" uf
        WHERE uf.user_id = $1
      `;
      
      const countResult = await pool.query(countQuery, [id]);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      
      // Query to get favorite properties with pagination
      const favoritesQuery = `
        SELECT 
          p.id,
          p.title,
          p.price,
          p.location,
          p.bedrooms,
          p.bathrooms,
          CONCAT(p.area, ' sq ft') AS area,
          p.property_type AS type,
          p.status,
          CASE 
            WHEN pi.id IS NOT NULL THEN CONCAT('/api/image/property/', pi.id)
            ELSE '/images/placeholder-property.jpg'
          END AS image,
          uf.created_at AS favorited_at
        FROM "user_favorite" uf
        JOIN "property" p ON uf.property_id = p.id
        LEFT JOIN (
          SELECT DISTINCT ON (property_id) id, property_id
          FROM "property_image"
          WHERE is_primary = true
          ORDER BY property_id, id
        ) pi ON p.id = pi.property_id
        WHERE uf.user_id = $1
        ORDER BY uf.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const favoritesResult = await pool.query(favoritesQuery, [id, limit, offset]);
      
      // Format property prices with currency
      const favorites = favoritesResult.rows.map(property => {
        return {
          ...property,
          price: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(property.price)
        };
      });
      
      res.status(200).json({
        items: favorites,
        itemType: 'favorites',
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      });
    }
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ error: 'Failed to fetch user items' });
  }
}