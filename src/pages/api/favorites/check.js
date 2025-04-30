import { isPropertyFavorited, getBatchFavoriteStatus } from '../../../lib/favoritesQueries';

export default async function handler(req, res) {
  // GET: Check if a property is favorited by a user
  if (req.method === 'GET') {
    const { userId, propertyId, propertyIds } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
      // If propertyIds is provided, get batch status
      if (propertyIds) {
        const ids = propertyIds.split(',').map(id => parseInt(id));
        const favoriteStatus = await getBatchFavoriteStatus(userId, ids);
        return res.status(200).json({ favoriteStatus });
      }
      // Otherwise check single property
      else if (propertyId) {
        const favorited = await isPropertyFavorited(userId, propertyId);
        return res.status(200).json({ favorited });
      }
      else {
        return res.status(400).json({ error: 'Property ID or property IDs are required' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to check favorite status', details: error.message });
    }
  }
  
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}