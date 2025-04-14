import { IncomingForm } from 'formidable';
import fs from 'fs';
import pool from '../../../db';
import { promisify } from 'util';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse form data using formidable
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true,
    });
    
    const readFile = promisify(fs.readFile);
    
    // Parse the form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });
    
    // Start a database transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Parse features from JSON string
      const features = JSON.parse(fields.features);
      
      // Insert property data into the database
      const propertyResult = await client.query(
        `INSERT INTO "property" (
          title, description, price, price_type, location, address, city, state, 
          zip_code, bedrooms, bathrooms, area, property_type, year_built, 
          realtor_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id`,
        [
          fields.title,
          fields.description,
          parseFloat(fields.price),
          fields.price_type,
          fields.location,
          fields.address,
          fields.city,
          fields.state || null,
          fields.zip_code || null,
          parseInt(fields.bedrooms),
          parseFloat(fields.bathrooms),
          parseFloat(fields.area),
          fields.property_type,
          fields.year_built ? parseInt(fields.year_built) : null,
          parseInt(fields.realtor_id),
          fields.status
        ]
      );
      
      const propertyId = propertyResult.rows[0].id;
      
      // Process main image
      if (files.mainImage) {
        const imageData = await readFile(files.mainImage.path);
        
        await client.query(
          `INSERT INTO "property_image" (property_id, image_data, is_primary)
          VALUES ($1, $2, $3)`,
          [propertyId, imageData, true]
        );
      }
      
      // Process additional images
      const additionalImageKeys = Object.keys(files).filter(key => key.startsWith('additionalImage_'));
      
      for (const key of additionalImageKeys) {
        const imageData = await readFile(files[key].path);
        
        await client.query(
          `INSERT INTO "property_image" (property_id, image_data, is_primary)
          VALUES ($1, $2, $3)`,
          [propertyId, imageData, false]
        );
      }
      
      // Process features
      for (const feature of features) {
        if (feature.feature_name && feature.feature_value) {
          await client.query(
            `INSERT INTO "property_feature" (property_id, feature_name, feature_value)
            VALUES ($1, $2, $3)`,
            [propertyId, feature.feature_name, feature.feature_value]
          );
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Clean up temporary files
      const fileKeys = Object.keys(files);
      for (const key of fileKeys) {
        fs.unlink(files[key].path, (err) => {
          if (err) console.error(`Failed to delete temporary file: ${err}`);
        });
      }
      
      return res.status(201).json({
        success: true,
        message: 'Property added successfully',
        propertyId: propertyId
      });
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error in transaction:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Server error while adding property',
        error: error.message
      });
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
  } catch (error) {
    console.error('Error processing form:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error processing form data',
      error: error.message
    });
  }
}