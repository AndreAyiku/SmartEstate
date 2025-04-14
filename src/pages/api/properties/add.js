import { IncomingForm } from 'formidable';
import fs from 'fs';
import pool from '../../../lib/db';
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

  // Client will be defined outside the try block so it can be accessed in finally
  let client;

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
    client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Parse features from JSON string
      const features = JSON.parse(fields.features);
      
      // Insert property data into the database
      // Insert property data into the database
const propertyResult = await client.query(
    `INSERT INTO "property" (
      title, description, price, price_type, location, address, city, state, 
      zip_code, bedrooms, bathrooms, area, property_type, year_built, 
      realtor_id, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id`,
    [
      fields.title.toString(),
      fields.description.toString(),
      parseFloat(fields.price),
      fields.price_type.toString(), // Ensure this is a plain string
      fields.location.toString(),
      fields.address.toString(),
      fields.city.toString(),
      fields.state ? fields.state.toString() : null,
      fields.zip_code ? fields.zip_code.toString() : null,
      parseInt(fields.bedrooms, 10),
      parseFloat(fields.bathrooms),
      parseFloat(fields.area),
      fields.property_type.toString(), // Ensure this is a plain string
      fields.year_built ? parseInt(fields.year_built, 10) : null,
      parseInt(fields.realtor_id, 10),
      fields.status.toString() // Ensure this is a plain string
    ]
  );
      
      const propertyId = propertyResult.rows[0].id;
      
      // Process main image
      if (files.mainImage) {
        try {
          // Log the structure to understand the format
          console.log('Main image file structure:', JSON.stringify(files.mainImage, null, 2));
          
          // Handle case where mainImage could be an array or single object
          const mainImageFile = Array.isArray(files.mainImage) ? files.mainImage[0] : files.mainImage;
          
          // Check for different possible path properties
          const filePath = mainImageFile.path || mainImageFile.filepath || 
                          (mainImageFile.toJSON ? mainImageFile.toJSON().filepath : null);
          
          if (!filePath) {
            console.error('Could not determine file path for main image:', mainImageFile);
            throw new Error('Invalid file path for main image');
          }
          
          const imageData = await readFile(filePath);
          
          await client.query(
            `INSERT INTO "property_image" (property_id, image_data, is_primary)
            VALUES ($1, $2, $3)`,
            [propertyId, imageData, true]
          );
        } catch (imageError) {
          console.error('Error processing main image:', imageError);
          throw imageError; // Rethrow to trigger rollback
        }
      }
      
      // Process additional images
      const additionalImageKeys = Object.keys(files).filter(key => key.startsWith('additionalImage_'));

      for (const key of additionalImageKeys) {
        try {
          const imageFile = Array.isArray(files[key]) ? files[key][0] : files[key];
          
          // Check for different possible path properties
          const filePath = imageFile.path || imageFile.filepath || 
                           (imageFile.toJSON ? imageFile.toJSON().filepath : null);
          
          if (!filePath) {
            console.error(`Could not determine file path for ${key}:`, imageFile);
            continue; // Skip this image but continue with others
          }
          
          const imageData = await readFile(filePath);
          
          await client.query(
            `INSERT INTO "property_image" (property_id, image_data, is_primary)
            VALUES ($1, $2, $3)`,
            [propertyId, imageData, false]
          );
        } catch (imageError) {
          console.error(`Error processing image ${key}:`, imageError);
          // Skip this image but continue with others
        }
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
      
      const fileKeys = Object.keys(files);
      for (const key of fileKeys) {
        try {
          const file = Array.isArray(files[key]) ? files[key][0] : files[key];
          const filePath = file.path || file.filepath;
          
          if (filePath) {
            fs.unlink(filePath, (err) => {
              if (err) console.error(`Failed to delete temporary file: ${err}`);
            });
          }
        } catch (err) {
          console.error(`Error cleaning up file ${key}:`, err);
        }
      }
      
      return res.status(201).json({
        success: true,
        message: 'Property added successfully',
        propertyId: propertyId
      });
      
    } catch (error) {
      // Rollback transaction on error
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('Error in transaction:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Server error while adding property',
        error: error.message
      });
    }
    
  } catch (error) {
    console.error('Error processing form:', error);
    console.error('Error details:', error.stack);
    
    // Only attempt rollback if client was defined
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while adding property',
      error: error.message
    });
    
  } finally {
    // Release the client back to the pool if it was obtained
    if (client) {
      client.release();
    }
  }
}