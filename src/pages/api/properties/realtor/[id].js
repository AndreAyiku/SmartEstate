import pool from '../../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ message: 'Realtor ID is required' });
  }
  
  if (req.method === 'GET') {
    try {
      // Check if user exists and is a realtor or admin
      const userQuery = 'SELECT id, user_type FROM "user" WHERE id = $1';
      const userResult = await pool.query(userQuery, [id]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const user = userResult.rows[0];
      if (user.user_type !== 'Realtor' && user.user_type !== 'Admin') {
        return res.status(403).json({ message: 'Unauthorized. User is not a realtor or admin.' });
      }
      
      // Fetch properties listed by the realtor
      const query = `
        SELECT 
          p.*,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'url', encode(pi.image_data, 'base64'),
                'is_primary', pi.is_primary
              )
            )
            FROM property_image pi
            WHERE pi.property_id = p.id), '[]'::json
          ) as images
        FROM property p
        WHERE p.realtor_id = $1
        ORDER BY p.created_at DESC
      `;
      
      const result = await pool.query(query, [id]);
      
      // Format property data
      const properties = result.rows.map(property => {
        // Process images if they exist
        let processedImages = property.images || [];
        if (processedImages && processedImages.length > 0) {
          processedImages = processedImages.map(img => ({
            ...img,
            url: `data:image/jpeg;base64,${img.url}`
          }));
        }
        
        return {
          ...property,
          images: processedImages,
          formattedPrice: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(property.price),
          formattedArea: `${property.area.toLocaleString()} sq ft`,
        };
      });
      
      return res.status(200).json(properties);
    } catch (error) {
      console.error('Error fetching realtor properties:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}