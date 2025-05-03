// pages/api/properties/[id].js
import pool from '../../../lib/db';
import { formidable } from 'formidable'; // Changed import syntax
import { readFile } from 'fs/promises';

// Add this configuration to disable the default body parser and increase the body size limit
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Property ID is required' });
  }

  // Handle DELETE method
  if (req.method === 'DELETE') {
    try {
      // Verify property exists
      const checkQuery = 'SELECT realtor_id FROM property WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Get user from session/token
      // Note: You should implement proper authentication
      const userString = req.headers.authorization?.split(' ')[1];
      let user;

      try {
        if (!userString) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        user = JSON.parse(Buffer.from(userString, 'base64').toString());
      } catch (error) {
        return res.status(401).json({ message: 'Invalid authentication' });
      }

      // Check if user is the property owner or an admin
      const property = checkResult.rows[0];
      if (property.realtor_id !== user.id && user.user_type !== 'Admin') {
        return res.status(403).json({ message: 'You do not have permission to delete this property' });
      }

      // Delete property (this will cascade to images and features due to DB constraints)
      const deleteQuery = 'DELETE FROM property WHERE id = $1';
      await pool.query(deleteQuery, [id]);

      return res.status(200).json({ message: 'Property deleted successfully' });
    } catch (error) {
      console.error('Error deleting property:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // Add this case for PUT method
  if (req.method === 'PUT') {
    try {
      // Parse form data including files
      const form = formidable({
        multiples: true,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024 // 10MB limit per file
      });
      
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });

      // Get property data from form fields
      let propertyData;
      try {
        propertyData = JSON.parse(fields.property);
      } catch (error) {
        console.error('Error parsing property data:', error);
        return res.status(400).json({ message: 'Invalid property data format' });
      }
      
      // Get user from session/token
      const userString = req.headers.authorization?.split(' ')[1];
      let user;
      
      try {
        if (!userString) {
          // For now, try to get user from the property data
          // In production, use proper authentication
          if (!fields.realtor_id) {
            return res.status(401).json({ message: 'Unauthorized' });
          }
          user = { id: fields.realtor_id };
        } else {
          user = JSON.parse(Buffer.from(userString, 'base64').toString());
        }
      } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'Invalid authentication' });
      }

      // Verify property ownership
      const checkQuery = 'SELECT realtor_id FROM property WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      const property = checkResult.rows[0];
      if (property.realtor_id !== user.id && user.user_type !== 'Admin') {
        return res.status(403).json({ message: 'You do not have permission to edit this property' });
      }

      // Start a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update property record
        const updateQuery = `
          UPDATE property
          SET title = $1, description = $2, price = $3, price_type = $4,
              location = $5, address = $6, city = $7, state = $8, 
              zip_code = $9, bedrooms = $10, bathrooms = $11, area = $12, 
              property_type = $13, year_built = $14, status = $15,
              latitude = $16, longitude = $17, updated_at = NOW()
          WHERE id = $18
        `;

        const location = `${propertyData.address}, ${propertyData.city}, ${propertyData.state}`;
        
        const updateValues = [
          propertyData.title,
          propertyData.description,
          propertyData.price,
          propertyData.price_type,
          location,
          propertyData.address,
          propertyData.city,
          propertyData.state,
          propertyData.zip_code,
          propertyData.bedrooms,
          propertyData.bathrooms,
          propertyData.area,
          propertyData.property_type,
          propertyData.year_built,
          propertyData.status,
          propertyData.latitude,
          propertyData.longitude,
          id
        ];

        await client.query(updateQuery, updateValues);

        // Handle features
        // Delete existing features
        await client.query('DELETE FROM property_feature WHERE property_id = $1', [id]);
        
        // Insert new/updated features
        if (propertyData.features && propertyData.features.length > 0) {
          for (const feature of propertyData.features) {
            if (feature.feature_name && feature.feature_value) {
              const insertFeatureQuery = `
                INSERT INTO property_feature (property_id, feature_name, feature_value)
                VALUES ($1, $2, $3)
              `;
              await client.query(insertFeatureQuery, [
                id,
                feature.feature_name,
                feature.feature_value
              ]);
            }
          }
        }

        // Handle images to delete
        if (propertyData.imagesToDelete && propertyData.imagesToDelete.length > 0) {
          const deleteImageQuery = `DELETE FROM property_image WHERE id = ANY($1::int[]) AND property_id = $2`;
          await client.query(deleteImageQuery, [propertyData.imagesToDelete, id]);
        }

        // Add main image if provided
        if (files.mainImage) {
          // First, set all existing images to not be primary
          await client.query('UPDATE property_image SET is_primary = false WHERE property_id = $1', [id]);
          
          const mainImageFile = files.mainImage;
          const mainImageBuffer = await readFile(mainImageFile.filepath);
          
          // Add the new main image as primary
          const insertMainImageQuery = `
            INSERT INTO property_image (property_id, image_data, is_primary)
            VALUES ($1, $2, true)
          `;
          await client.query(insertMainImageQuery, [id, mainImageBuffer]);
        }

        // Add additional images if provided
        if (files.additionalImages) {
          const additionalImageFiles = Array.isArray(files.additionalImages) 
            ? files.additionalImages 
            : [files.additionalImages];
            
          for (const imageFile of additionalImageFiles) {
            const imageBuffer = await readFile(imageFile.filepath);
            const insertImageQuery = `
              INSERT INTO property_image (property_id, image_data, is_primary)
              VALUES ($1, $2, false)
            `;
            await client.query(insertImageQuery, [id, imageBuffer]);
          }
        }

        await client.query('COMMIT');

        return res.status(200).json({ 
          message: 'Property updated successfully', 
          propertyId: id 
        });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating property:', error);
        return res.status(500).json({ message: 'Failed to update property', error: error.message });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error parsing form data:', error);
      return res.status(400).json({ message: 'Invalid form data', error: error.message });
    }
  }

  // Handle GET request (get property details)
  if (req.method === 'GET') {
    try {
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
        zip_code: property.zip_code,
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

  // If method is not supported
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}