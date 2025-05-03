import { calculateDistance } from '../../../lib/mapQueries';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { originLat, originLng, destLat, destLng, unit = 'miles' } = req.query;
    
    // Validate required parameters
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide originLat, originLng, destLat, and destLng.'
      });
    }
    
    // Parse coordinates
    const origin = {
      lat: parseFloat(originLat),
      lng: parseFloat(originLng)
    };
    
    const destination = {
      lat: parseFloat(destLat),
      lng: parseFloat(destLng)
    };
    
    // Calculate distance
    const distance = calculateDistance(origin, destination, unit);
    
    return res.status(200).json({
      distance,
      unit,
      origin,
      destination
    });
    
  } catch (error) {
    console.error('Error calculating distance:', error);
    return res.status(500).json({ error: 'Server error calculating distance' });
  }
}