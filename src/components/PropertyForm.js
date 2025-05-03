import { useState, useEffect } from 'react';
import styles from '../styles/AddProperty.module.css';
import LocationPicker from './LocationPicker';

const PropertyForm = ({ 
  initialData, 
  onSubmit, 
  isSubmitting, 
  submitError,
  formType = 'add' // 'add' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    priceType: 'Sale',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    propertyType: 'House',
    yearBuilt: '',
    status: 'Available',
    latitude: null,
    longitude: null,
    features: []
  });
  
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  // Initialize form with data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        price: initialData.price || '',
        priceType: initialData.priceType || 'Sale',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        bedrooms: initialData.bedrooms || '',
        bathrooms: initialData.bathrooms || '',
        area: initialData.area || '',
        propertyType: initialData.propertyType || 'House',
        yearBuilt: initialData.yearBuilt || '',
        status: initialData.status || 'Available',
        latitude: initialData.latitude || null,
        longitude: initialData.longitude || null,
        features: initialData.features || []
      });

      if (initialData.existingImages) {
        setExistingImages(initialData.existingImages);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers and decimal points
    if (!isNaN(value) || value === '') {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCoordinatesChange = (lat, lng) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Preview images
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: false
    }));
    
    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    // Revoke object URL to avoid memory leaks
    if (newImages[index].preview) {
      URL.revokeObjectURL(newImages[index].preview);
    }
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleRemoveExistingImage = (imageId) => {
    const newExistingImages = existingImages.filter(img => img.id !== imageId);
    setExistingImages(newExistingImages);
    setImagesToDelete([...imagesToDelete, imageId]);
  };

  const handleSetPrimaryImage = (index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setImages(newImages);
  };

  const handleSetExistingPrimaryImage = (imageId) => {
    const newExistingImages = existingImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    setExistingImages(newExistingImages);
  };

  const handleFeatureChange = (index, field, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value
    };
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { feature_name: '', feature_value: '' }]
    });
  };

  const removeFeature = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for submission
    const formDataToSend = new FormData();
    
    // Add property data
    formDataToSend.append('property', JSON.stringify({
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      priceType: formData.priceType,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseFloat(formData.bathrooms),
      area: parseFloat(formData.area),
      propertyType: formData.propertyType,
      yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
      status: formData.status,
      latitude: formData.latitude,
      longitude: formData.longitude,
      features: formData.features
    }));

    if (formType === 'edit') {
      formDataToSend.append('imagesToDelete', JSON.stringify(imagesToDelete));
      formDataToSend.append('existingImagesData', JSON.stringify(existingImages));
    }
    
    // Add new images
    images.forEach((image, index) => {
      formDataToSend.append('images', image.file);
      formDataToSend.append('imageInfo', JSON.stringify({
        index,
        isPrimary: image.isPrimary
      }));
    });
    
    onSubmit(formDataToSend);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.propertyForm}>
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Basic Information</h2>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Property Title*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter property title"
              required
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description*</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your property..."
            rows={5}
            required
          ></textarea>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="price">Price*</label>
            <div className={styles.inputWithIcon}>
              <span className={styles.currencySymbol}>$</span>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleNumberChange}
                placeholder="Enter price"
                className={styles.priceInput}
                required
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="priceType">Price Type*</label>
            <select
              id="priceType"
              name="priceType"
              value={formData.priceType}
              onChange={handleChange}
              required
            >
              <option value="Sale">For Sale</option>
              <option value="Rent">For Rent</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Location</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="address">Address*</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter street address"
            required
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="city">City*</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="state">State/Province*</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter state/province"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="zipCode">Zip/Postal Code*</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="Enter zip/postal code"
              required
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>Select Location on Map</label>
          <LocationPicker 
            initialLatitude={formData.latitude}
            initialLongitude={formData.longitude}
            onCoordinatesChange={handleCoordinatesChange}
          />
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Property Details</h2>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="propertyType">Property Type*</label>
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              required
            >
              <option value="House">House</option>
              <option value="Apartment">Apartment</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Villa">Villa</option>
              <option value="Studio">Studio</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="status">Status*</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="Available">Available</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
              <option value="Rented">Rented</option>
              <option value="Off Market">Off Market</option>
            </select>
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="bedrooms">Bedrooms*</label>
            <input
              type="number"
              id="bedrooms"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleNumberChange}
              placeholder="Number of bedrooms"
              min="0"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bathrooms">Bathrooms*</label>
            <input
              type="text"
              id="bathrooms"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleNumberChange}
              placeholder="Number of bathrooms"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="area">Area (sq ft)*</label>
            <input
              type="text"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleNumberChange}
              placeholder="Property area"
              required
            />
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="yearBuilt">Year Built (Optional)</label>
            <input
              type="number"
              id="yearBuilt"
              name="yearBuilt"
              value={formData.yearBuilt}
              onChange={handleNumberChange}
              placeholder="Construction year"
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Features & Amenities</h2>
        
        {formData.features.map((feature, index) => (
          <div key={index} className={styles.featureRow}>
            <div className={styles.formGroup}>
              <input
                type="text"
                placeholder="Feature name (e.g., Garage, Pool)"
                value={feature.feature_name}
                onChange={(e) => handleFeatureChange(index, 'feature_name', e.target.value)}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <input
                type="text"
                placeholder="Value (e.g., 2 Cars, Yes)"
                value={feature.feature_value}
                onChange={(e) => handleFeatureChange(index, 'feature_value', e.target.value)}
                required
              />
            </div>
            
            <button
              type="button"
              className={styles.removeFeatureButton}
              onClick={() => removeFeature(index)}
            >
              <i className="bx bx-trash"></i>
            </button>
          </div>
        ))}
        
        <button
          type="button"
          className={styles.addFeatureButton}
          onClick={addFeature}
        >
          <i className="bx bx-plus"></i> Add Feature
        </button>
      </div>
      
      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>Property Images</h2>
        
        {/* Existing Images - Only show if editing */}
        {formType === 'edit' && existingImages.length > 0 && (
          <div className={styles.imageSection}>
            <h3>Current Images</h3>
            <div className={styles.imagesGrid}>
              {existingImages.map((image) => (
                <div key={image.id} className={styles.imagePreviewContainer}>
                  <img
                    src={image.url}
                    alt="Property"
                    className={styles.imagePreview}
                  />
                  <div className={styles.imageActions}>
                    <button
                      type="button"
                      className={`${styles.primaryImageButton} ${image.is_primary ? styles.active : ''}`}
                      onClick={() => handleSetExistingPrimaryImage(image.id)}
                      title="Set as primary image"
                    >
                      <i className="bx bx-star"></i>
                    </button>
                    <button
                      type="button"
                      className={styles.removeImageButton}
                      onClick={() => handleRemoveExistingImage(image.id)}
                      title="Remove image"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                  {image.is_primary && (
                    <span className={styles.primaryBadge}>Primary Image</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* New Images */}
        <div className={styles.imageUploadSection}>
          <h3>{formType === 'edit' ? 'Add New Images' : 'Upload Images'}</h3>
          <div className={styles.imageUploadContainer}>
            <label htmlFor="images" className={styles.imageUploadLabel}>
              <i className="bx bx-image-add"></i>
              <span>Click to add images</span>
            </label>
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className={styles.imageInput}
            />
          </div>
          
          {images.length > 0 && (
            <div className={styles.imagesGrid}>
              {images.map((image, index) => (
                <div key={index} className={styles.imagePreviewContainer}>
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className={styles.imagePreview}
                  />
                  <div className={styles.imageActions}>
                    <button
                      type="button"
                      className={`${styles.primaryImageButton} ${image.isPrimary ? styles.active : ''}`}
                      onClick={() => handleSetPrimaryImage(index)}
                      title="Set as primary image"
                    >
                      <i className="bx bx-star"></i>
                    </button>
                    <button
                      type="button"
                      className={styles.removeImageButton}
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                  {image.isPrimary && (
                    <span className={styles.primaryBadge}>Primary Image</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {submitError && (
        <div className={styles.formError}>
          <i className="bx bx-error-circle"></i>
          <p>{submitError}</p>
        </div>
      )}
      
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="bx bx-loader bx-spin"></i> {formType === 'edit' ? 'Updating...' : 'Creating...'}
            </>
          ) : (formType === 'edit' ? 'Update Property' : 'Create Property')}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;