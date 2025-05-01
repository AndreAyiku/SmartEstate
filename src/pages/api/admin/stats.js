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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Verify admin status
    const userId = req.headers['user-id'];
    if (!userId || !(await isAdmin(userId))) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get total users
    const usersQuery = 'SELECT COUNT(*) as total FROM "user"';
    const usersResult = await pool.query(usersQuery);
    const totalUsers = parseInt(usersResult.rows[0].total);
    
    // Get user type distribution
    const userTypesQuery = 'SELECT user_type, COUNT(*) as count FROM "user" GROUP BY user_type';
    const userTypesResult = await pool.query(userTypesQuery);
    const userTypeDistribution = {};
    
    userTypesResult.rows.forEach(row => {
      userTypeDistribution[row.user_type] = parseInt(row.count);
    });
    
    // Get realtor count
    const realtorCount = userTypeDistribution['Realtor'] || 0;
    
    // Get total properties
    const propertiesQuery = 'SELECT COUNT(*) as total FROM property';
    const propertiesResult = await pool.query(propertiesQuery);
    const totalProperties = parseInt(propertiesResult.rows[0].total);
    
    // Get active properties (status = 'Available')
    const activePropertiesQuery = 'SELECT COUNT(*) as total FROM property WHERE status = $1';
    const activePropertiesResult = await pool.query(activePropertiesQuery, ['Available']);
    const activeProperties = parseInt(activePropertiesResult.rows[0].total);
    
    // Get property status distribution
    const propertyStatusQuery = 'SELECT status, COUNT(*) as count FROM property GROUP BY status';
    const propertyStatusResult = await pool.query(propertyStatusQuery);
    const propertyStatusDistribution = {};
    
    propertyStatusResult.rows.forEach(row => {
      propertyStatusDistribution[row.status] = parseInt(row.count);
    });
    
    // Get new users this month
    const newUsersThisMonth = 0;
    
    // Get new properties this month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const newPropertiesQuery = 'SELECT COUNT(*) as total FROM property WHERE created_at >= $1';
    const newPropertiesResult = await pool.query(newPropertiesQuery, [firstDayOfMonth]);
    const newPropertiesThisMonth = parseInt(newPropertiesResult.rows[0]?.total || 0);
    
    // Get total messages
    const messagesQuery = 'SELECT COUNT(*) as total FROM message';
    const messagesResult = await pool.query(messagesQuery);
    const totalMessages = parseInt(messagesResult.rows[0].total);
    
    // Get total favorites
    const favoritesQuery = 'SELECT COUNT(*) as total FROM user_favorite';
    const favoritesResult = await pool.query(favoritesQuery);
    const totalFavorites = parseInt(favoritesResult.rows[0].total);
    
    return res.status(200).json({
      totalUsers,
      realtorCount,
      totalProperties,
      activeProperties,
      userTypeDistribution,
      propertyStatusDistribution,
      newUsersThisMonth,
      newPropertiesThisMonth,
      totalMessages,
      totalFavorites
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
}