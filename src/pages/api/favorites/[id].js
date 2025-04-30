import { removeFavorite } from '../../../lib/favoritesQueries';

export default async function handler(req, res) {
  // DELETE: Remove a property from favorites
  if (req.method === 'DELETE') {
    const propertyId = req.query.id;
    const { userId } = req.query;
    
    if (!userId || !propertyId) {
      return res.status(400).json({ error: 'User ID and property ID are required' });
    }
    
    try {
      const result = await removeFavorite(userId, propertyId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove favorite', details: error.message });
    }
  }
  
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}