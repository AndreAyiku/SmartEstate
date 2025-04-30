import { getUserFavorites, addFavorite } from '../../../lib/favoritesQueries';

export default async function handler(req, res) {
  // GET: Fetch all favorites for a user
  if (req.method === 'GET') {
    const { userId, page = 1 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
      const favorites = await getUserFavorites(userId, parseInt(page));
      return res.status(200).json(favorites);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch favorites', details: error.message });
    }
  }
  
  // POST: Add a property to favorites
  else if (req.method === 'POST') {
    const { userId, propertyId } = req.body;
    
    if (!userId || !propertyId) {
      return res.status(400).json({ error: 'User ID and property ID are required' });
    }
    
    try {
      const result = await addFavorite(userId, propertyId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to add favorite', details: error.message });
    }
  }
  
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}