import pool from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('Maps properties API called with query:', req.query);
    
    // Get query parameters for filtering
    const { type, priceRange, distance, lat, lng } = req.query;
    
    // Set a timeout to prevent long-running queries
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
    );
    
    // Build the query to get properties with coordinates
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
        p.latitude,
        p.longitude,
        encode((SELECT image_data FROM property_image 
               WHERE property_id = p.id AND is_primary = true 
               LIMIT 1), 'base64') as image_base64
      FROM property p
      WHERE p.latitude IS NOT NULL 
      AND p.longitude IS NOT NULL
      AND p.status = 'Available'
    `;
    
    // Array to hold query parameters
    const queryParams = [];
    let paramIndex = 1;
    
    // Add filter for property type
    if (type) {
      query += ` AND p.property_type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }
    
    // Add filter for price range
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-');
      
      if (minPrice && maxPrice) {
        query += ` AND p.price BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(parseFloat(minPrice), parseFloat(maxPrice));
        paramIndex += 2;
      } else if (minPrice) {
        query += ` AND p.price >= $${paramIndex}`;
        queryParams.push(parseFloat(minPrice));
        paramIndex++;
      } else if (maxPrice) {
        query += ` AND p.price <= $${paramIndex}`;
        queryParams.push(parseFloat(maxPrice));
        paramIndex++;
      }
    }
    
    // Add sorting and limit
    query += ` ORDER BY p.created_at DESC LIMIT 100`;
    
    // Execute the query with a timeout
    const queryPromise = pool.query(query, queryParams);
    const result = await Promise.race([queryPromise, timeoutPromise]);
    
    // Format the properties with proper data types
    const properties = result.rows.map(property => ({
      id: property.id,
      title: property.title,
      price: parseFloat(property.price),
      formattedPrice: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(property.price),
      price_type: property.price_type,
      location: `${property.location}, ${property.city}`,
      bedrooms: property.bedrooms,
      bathrooms: parseFloat(property.bathrooms),
      area: `${parseFloat(property.area).toLocaleString()} sqft`,
      property_type: property.property_type,
      status: property.status,
      latitude: parseFloat(property.latitude),
      longitude: parseFloat(property.longitude),
      image: property.image_base64 ? `data:image/jpeg;base64,${property.image_base64}` : null
    }));
    
    console.log(`Returning ${properties.length} properties`);
    return res.status(200).json({ properties });
  } catch (error) {
    console.error('Error fetching map properties:', error);
    return res.status(500).json({ 
      error: 'Server error fetching properties',
      details: error.message
    });
  }
}