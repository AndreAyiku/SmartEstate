// pages/api/properties/[id].js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    // Validate the ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    // Get property details
    const propertyQuery = `
      SELECT 
        p.*,
        u.id as realtor_id,
        u.username as realtor_name,
        u.email as realtor_email,
        u.phone_number as realtor_phone,
        u.profile_picture as realtor_profile_picture
      FROM property p
      LEFT JOIN "user" u ON p.realtor_id = u.id
      WHERE p.id = $1
    `;
    
    const propertyResult = await pool.query(propertyQuery, [id]);
    
    // Check if property exists
    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const property = propertyResult.rows[0];
    
    // Get property images
    const imagesQuery = `
      SELECT id, image_data, is_primary
      FROM property_image
      WHERE property_id = $1
      ORDER BY is_primary DESC, id ASC
    `;
    
    const imagesResult = await pool.query(imagesQuery, [id]);
    
    // Get property features
    const featuresQuery = `
      SELECT id, feature_name, feature_value
      FROM property_feature
      WHERE property_id = $1
    `;
    
    const featuresResult = await pool.query(featuresQuery, [id]);
    
    // Format the response
    const formattedProperty = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      formattedPrice: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(property.price) + (property.price_type === 'Rent' ? '/month' : ''),
      price_type: property.price_type,
      location: property.location,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zip_code,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      formattedArea: `${property.area.toLocaleString()} sq ft`,
      property_type: property.property_type,
      year_built: property.year_built,
      status: property.status,
      created_at: property.created_at,
      updated_at: property.updated_at,
      latitude: parseFloat(property.latitude),
      longitude: parseFloat(property.longitude),
      realtor: {
        id: property.realtor_id,
        name: property.realtor_name,
        email: property.realtor_email,
        phone: property.realtor_phone || "Not provided", // Use the phone number from database or fallback
        profile_picture: property.realtor_profile_picture 
          ? `data:image/jpeg;base64,${Buffer.from(property.realtor_profile_picture).toString('base64')}` 
          : null
      },
      images: imagesResult.rows.map(img => ({
        id: img.id,
        url: `data:image/jpeg;base64,${Buffer.from(img.image_data).toString('base64')}`,
        is_primary: img.is_primary
      })),
      features: featuresResult.rows.map(feature => ({
        id: feature.id,
        feature_name: feature.feature_name,
        feature_value: feature.feature_value
      }))
    };
    
    return res.status(200).json(formattedProperty);
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}