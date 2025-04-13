
import pool from '../../lib/db';

export default async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get query parameters for filtering
    const { 
      searchTerm, 
      propertyType, 
      priceRange, 
      bedrooms, 
      bathrooms,
      page = 1,
      limit = 6
    } = req.query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build the base query
    let query = `
      SELECT 
        p.id, 
        p.title, 
        p.price, 
        p.price_type,
        p.location, 
        p.city,
        p.bedrooms, 
        p.bathrooms, 
        p.area,
        p.property_type,
        p.status,
        (SELECT image_data FROM property_image WHERE property_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM property p
      WHERE p.status = 'Available'
    `;
    
    // Array to hold query parameters
    const queryParams = [];
    let paramCounter = 1;
    
    // Add search filter if provided
    if (searchTerm) {
      query += ` AND (
        p.title ILIKE $${paramCounter} OR 
        p.location ILIKE $${paramCounter} OR 
        p.city ILIKE $${paramCounter} OR
        p.property_type ILIKE $${paramCounter}
      )`;
      queryParams.push(`%${searchTerm}%`);
      paramCounter++;
    }
    
    // Add property type filter if provided
    if (propertyType && propertyType !== '') {
      query += ` AND p.property_type = $${paramCounter}`;
      queryParams.push(propertyType);
      paramCounter++;
    }
    
    // Add price range filter if provided
    if (priceRange && priceRange !== '') {
      const [minPrice, maxPrice] = priceRange.split('-');
      
      if (minPrice && maxPrice) {
        query += ` AND p.price BETWEEN $${paramCounter} AND $${paramCounter + 1}`;
        queryParams.push(parseFloat(minPrice), parseFloat(maxPrice));
        paramCounter += 2;
      } else if (minPrice && !maxPrice) {
        // Handle 1000000+ type ranges
        query += ` AND p.price >= $${paramCounter}`;
        queryParams.push(parseFloat(minPrice));
        paramCounter++;
      }
    }
    
    // Add bedrooms filter if provided
    if (bedrooms && bedrooms !== '') {
      query += ` AND p.bedrooms >= $${paramCounter}`;
      queryParams.push(parseInt(bedrooms));
      paramCounter++;
    }
    
    // Add bathrooms filter if provided
    if (bathrooms && bathrooms !== '') {
      query += ` AND p.bathrooms >= $${paramCounter}`;
      queryParams.push(parseFloat(bathrooms));
      paramCounter++;
    }
    
    // Count total matching records for pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    // Execute the query
    const result = await pool.query(query, queryParams);
    
    // Format the results for frontend use
    const properties = result.rows.map(property => {
      // Convert BYTEA to base64 for the image
      const imageBase64 = property.primary_image 
        ? `data:image/jpeg;base64,${Buffer.from(property.primary_image).toString('base64')}` 
        : null;
      
      return {
        id: property.id,
        title: property.title,
        price: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(property.price) + (property.price_type === 'Rent' ? '/month' : ''),
        location: `${property.location}, ${property.city}`,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: `${property.area.toLocaleString()} sqft`,
        type: property.property_type,
        image: imageBase64 || '/property-placeholder.jpg'
      };
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Return the properties with pagination info
    return res.status(200).json({
      properties,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}

