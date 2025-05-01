import pool from '../../../lib/db';

// Function to verify if user is admin
async function isAdmin(userId) {
  try {
    if (!userId) {
      console.log('No userId provided');
      return false;
    }
    
    const query = 'SELECT user_type FROM "user" WHERE id = $1';
    const { rows } = await pool.query(query, [userId]);
    
    const isAdminUser = rows.length > 0 && rows[0].user_type === 'Admin';
    console.log(`User ID ${userId} is admin: ${isAdminUser}`);
    return isAdminUser;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
}

export default async function handler(req, res) {
  console.log('Admin users API called with method:', req.method);
  console.log('Headers:', req.headers);
  
  // Extract admin user ID from headers for authorization
  const adminUserId = req.headers['user-id'];
  console.log('Admin user ID from headers:', adminUserId);
  
  // Verify admin status before proceeding
  try {
    if (!adminUserId) {
      console.log('No user ID provided in headers');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const isAdminUser = await isAdmin(adminUserId);
    console.log('Is admin check result:', isAdminUser);
    
    if (!isAdminUser) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ error: 'Unauthorized access' });
    }
  } catch (error) {
    console.error('Error in admin API:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
  
  // GET request - Fetch users with pagination and filters
  if (req.method === 'GET') {
    try {
      console.log('Processing GET request for users');
      const { page = 1, search = '', userType = '' } = req.query;
      console.log('Query parameters:', { page, search, userType });
      
      const limit = 10; // Users per page
      const offset = (page - 1) * limit;
      
      // Build the basic query first
      let queryParams = [];
      let conditions = [];
      
      // Simplify the query to avoid potential issues
      let queryString = `
        SELECT 
          u.id, 
          u.username, 
          u.email, 
          u.user_type,
          COUNT(p.id) as property_count
        FROM "user" u
        LEFT JOIN property p ON u.id = p.realtor_id
      `;
      
      // Add WHERE conditions if filters are provided
      if (search) {
        queryParams.push(`%${search}%`);
        queryParams.push(`%${search}%`);
        conditions.push(`(u.username ILIKE $${queryParams.length - 1} OR u.email ILIKE $${queryParams.length})`);
      }
      
      if (userType) {
        queryParams.push(userType);
        conditions.push(`u.user_type = $${queryParams.length}`);
      }
      
      if (conditions.length > 0) {
        queryString += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      // Count total users matching the filters
      let countQueryString = `SELECT COUNT(*) as total FROM "user" u`;
      if (conditions.length > 0) {
        countQueryString += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      console.log('Executing count query');
      const countResult = await pool.query(countQueryString, queryParams);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      console.log('Total users:', total, 'Total pages:', totalPages);
      
      // Add group by, limits and offset
      queryString += `
        GROUP BY u.id, u.username, u.email, u.user_type
        ORDER BY u.id ASC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      
      // Add limit and offset parameters
      queryParams.push(limit, offset);
      
      console.log('Executing main query');
      const result = await pool.query(queryString, queryParams);
      console.log(`Retrieved ${result.rows.length} users`);
      
      return res.status(200).json({
        users: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch users', 
        details: error.message,
        stack: error.stack
      });
    }
  }
  
  // DELETE request - Remove a user
  else if (req.method === 'DELETE') {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // First check if the user to delete is an admin
      const checkAdminQuery = 'SELECT user_type FROM "user" WHERE id = $1';
      const adminCheckResult = await pool.query(checkAdminQuery, [userId]);
      
      if (adminCheckResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (adminCheckResult.rows[0].user_type === 'Admin') {
        return res.status(403).json({ error: 'Cannot delete admin users' });
      }
      
      // Start a transaction to ensure all related data is deleted
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Delete user's favorites
        await client.query('DELETE FROM user_favorite WHERE user_id = $1', [userId]);
        
        // Delete user's messages
        await client.query('DELETE FROM message WHERE sender_id = $1 OR receiver_id = $1', [userId]);
        
        // Delete user's reviews
        await client.query('DELETE FROM review WHERE user_id = $1', [userId]);
        
        // Delete user's viewings
        await client.query('DELETE FROM property_viewing WHERE user_id = $1', [userId]);
        
        // If user is a realtor, handle their properties
        // Option 1: Delete the properties
        await client.query(`
          DELETE FROM property_image
          WHERE property_id IN (SELECT id FROM property WHERE realtor_id = $1)
        `, [userId]);
        
        await client.query(`
          DELETE FROM property_feature
          WHERE property_id IN (SELECT id FROM property WHERE realtor_id = $1)
        `, [userId]);
        
        await client.query('DELETE FROM property WHERE realtor_id = $1', [userId]);
        
        // Finally delete the user
        const deleteUserQuery = 'DELETE FROM "user" WHERE id = $1';
        await client.query(deleteUserQuery, [userId]);
        
        await client.query('COMMIT');
        
        return res.status(200).json({ 
          success: true, 
          message: 'User deleted successfully' 
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }
  
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}