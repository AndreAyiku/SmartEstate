import pool from '../../../lib/db';

// Function to verify if user is admin
async function isAdmin(userId) {
  try {
    const query = 'SELECT user_type FROM "user" WHERE id = $1';
    const { rows } = await pool.query(query, [userId]);
    
    return rows.length > 0 && rows[0].user_type === 'Admin';
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
}

export default async function handler(req, res) {
  console.log('Admin properties API called with method:', req.method);
  
  // Extract admin user ID from headers for authorization
  const adminUserId = req.headers['user-id'];
  console.log('Admin user ID from headers:', adminUserId);
  
  // Verify admin status before proceeding
  try {
    const isAdminUser = await isAdmin(adminUserId);
    console.log('Is admin check result:', isAdminUser);
    
    if (!adminUserId || !isAdminUser) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ error: 'Unauthorized access' });
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ error: 'Error verifying admin status' });
  }
  
  // GET request - Fetch properties with pagination and filters
  if (req.method === 'GET') {
    try {
      console.log('Processing GET request for properties');
      const { page = 1, search = '', status = '', type = '' } = req.query;
      console.log('Query parameters:', { page, search, status, type });
      
      const limit = 10; // Properties per page
      const offset = (page - 1) * limit;
      
      // Build the basic query first
      let queryParams = [];
      let conditions = [];
      
      // Simplify the query
      let queryString = `
        SELECT 
          p.id, 
          p.title, 
          p.price, 
          p.property_type, 
          p.status, 
          p.location,
          json_build_object(
            'id', u.id,
            'username', u.username,
            'email', u.email
          ) as realtor
        FROM property p
        LEFT JOIN "user" u ON p.realtor_id = u.id
      `;
      
      // Add WHERE conditions if filters are provided
      if (search) {
        queryParams.push(`%${search}%`);
        queryParams.push(`%${search}%`);
        queryParams.push(`%${search}%`);
        conditions.push(`(
          p.title ILIKE $${queryParams.length - 2} OR 
          p.description ILIKE $${queryParams.length - 1} OR 
          p.location ILIKE $${queryParams.length}
        )`);
      }
      
      if (status) {
        queryParams.push(status);
        conditions.push(`p.status = $${queryParams.length}`);
      }
      
      if (type) {
        queryParams.push(type);
        conditions.push(`p.property_type = $${queryParams.length}`);
      }
      
      if (conditions.length > 0) {
        queryString += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      // Count query
      let countQueryString = `SELECT COUNT(*) as total FROM property p`;
      if (conditions.length > 0) {
        countQueryString += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      console.log('Executing count query');
      const countResult = await pool.query(countQueryString, queryParams);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      console.log('Total properties:', total, 'Total pages:', totalPages);
      
      // Add ordering, limit, and offset
      queryString += `
        ORDER BY p.id DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      
      // Add limit and offset parameters
      queryParams.push(limit, offset);
      
      console.log('Executing main query');
      const result = await pool.query(queryString, queryParams);
      console.log(`Retrieved ${result.rows.length} properties`);
      
      return res.status(200).json({
        properties: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch properties', 
        details: error.message,
        stack: error.stack 
      });
    }
  }
  
  // DELETE request - Remove a property
  else if (req.method === 'DELETE') {
    try {
      const { propertyId } = req.query;
      
      if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }
      
      // Check if property exists
      const checkPropertyQuery = 'SELECT id FROM property WHERE id = $1';
      const propertyCheckResult = await pool.query(checkPropertyQuery, [propertyId]);
      
      if (propertyCheckResult.rows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }
      
      // Start a transaction to ensure all related data is deleted
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete property images
        await client.query('DELETE FROM property_image WHERE property_id = $1', [propertyId]);
        
        // Delete property features
        await client.query('DELETE FROM property_feature WHERE property_id = $1', [propertyId]);
        
        // Delete user favorites for this property
        await client.query('DELETE FROM user_favorite WHERE property_id = $1', [propertyId]);
        
        // Delete property viewings
        await client.query('DELETE FROM property_viewing WHERE property_id = $1', [propertyId]);
        
        // Delete messages related to this property
        await client.query('DELETE FROM message WHERE property_id = $1', [propertyId]);
        
        // Delete reviews for this property
        await client.query('DELETE FROM review WHERE property_id = $1', [propertyId]);
        
        // Finally delete the property
        const deletePropertyQuery = 'DELETE FROM property WHERE id = $1';
        await client.query(deletePropertyQuery, [propertyId]);
        
        await client.query('COMMIT');
        
        return res.status(200).json({ 
          success: true, 
          message: 'Property deleted successfully' 
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      return res.status(500).json({ error: 'Failed to delete property' });
    }
  }
  
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}