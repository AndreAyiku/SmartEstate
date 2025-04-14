import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  
  try {
    // Get image data from database
    const result = await pool.query(
      'SELECT image_data FROM property_image WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Get binary image data
    const imageData = result.rows[0].image_data;
    
    // Set headers and send image
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.status(200).send(imageData);
    
  } catch (error) {
    console.error('Error fetching image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}