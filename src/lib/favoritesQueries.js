import pool from './db';

// Get all favorites for a user
export async function getUserFavorites(userId, page = 1, limit = 12) {
  const offset = (page - 1) * limit;
  
  try {
    // Count total favorites
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM "user_favorite"
      WHERE user_id = $1
    `;
    
    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    // Get favorites with pagination
    const favoritesQuery = `
      SELECT 
        p.id,
        p.title,
        p.price,
        p.location,
        p.address,
        p.city,
        p.state,
        p.bedrooms,
        p.bathrooms,
        p.area,
        p.property_type AS type,
        p.status,
        p.price_type,
        encode(pi.image_data, 'base64') as image_base64,
        uf.created_at AS favorited_at
      FROM "user_favorite" uf
      JOIN "property" p ON uf.property_id = p.id
      LEFT JOIN (
        SELECT DISTINCT ON (property_id) id, property_id, image_data
        FROM "property_image"
        WHERE is_primary = true
        ORDER BY property_id, id
      ) pi ON p.id = pi.property_id
      WHERE uf.user_id = $1
      ORDER BY uf.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const favoritesResult = await pool.query(favoritesQuery, [userId, limit, offset]);
    
    // Format the favorites for display
    const favorites = favoritesResult.rows.map(property => ({
      id: property.id,
      title: property.title,
      price: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(property.price),
      location: property.location,
      address: property.address,
      city: property.city,
      state: property.state,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: `${property.area} sq ft`,
      type: property.type,
      status: property.status,
      price_type: property.price_type,
      image: property.image_base64 
        ? `data:image/jpeg;base64,${property.image_base64}`
        : null,
      favorited_at: property.favorited_at
    }));
    
    return {
      favorites,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    throw error;
  }
}

// Check if a property is favorited by a user
export async function isPropertyFavorited(userId, propertyId) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM "user_favorite"
        WHERE user_id = $1 AND property_id = $2
      ) AS favorited
    `;
    
    const result = await pool.query(query, [userId, propertyId]);
    return result.rows[0].favorited;
  } catch (error) {
    console.error('Error checking if property is favorited:', error);
    throw error;
  }
}

// Add a property to user favorites
export async function addFavorite(userId, propertyId) {
  try {
    // Check if already favorited to prevent duplicate error
    const alreadyFavorited = await isPropertyFavorited(userId, propertyId);
    if (alreadyFavorited) {
      return { success: true, message: 'Property is already in favorites' };
    }
    
    const query = `
      INSERT INTO "user_favorite" (user_id, property_id)
      VALUES ($1, $2)
      RETURNING id, created_at
    `;
    
    const result = await pool.query(query, [userId, propertyId]);
    
    return {
      success: true,
      id: result.rows[0].id,
      created_at: result.rows[0].created_at
    };
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
}

// Remove a property from user favorites
export async function removeFavorite(userId, propertyId) {
  try {
    const query = `
      DELETE FROM "user_favorite"
      WHERE user_id = $1 AND property_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId, propertyId]);
    
    return {
      success: true,
      removed: result.rowCount > 0
    };
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
}

// Get favorite status for multiple properties
export async function getBatchFavoriteStatus(userId, propertyIds) {
  try {
    const query = `
      SELECT property_id, TRUE as favorited
      FROM "user_favorite"
      WHERE user_id = $1 AND property_id = ANY($2::int[])
    `;
    
    const result = await pool.query(query, [userId, propertyIds]);
    
    // Create a map of propertyId -> favorited status
    const favoriteStatus = {};
    propertyIds.forEach(id => {
      favoriteStatus[id] = false;
    });
    
    result.rows.forEach(row => {
      favoriteStatus[row.property_id] = true;
    });
    
    return favoriteStatus;
  } catch (error) {
    console.error('Error fetching batch favorite status:', error);
    throw error;
  }
}