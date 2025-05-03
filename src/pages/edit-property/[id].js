import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../../components/Navigation';
import styles from '../../styles/AddProperty.module.css';
import LocationPicker from '../../components/LocationPicker';

export default function EditPropertyPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_type: 'Sale',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    property_type: 'House',
    year_built: '',
    status: 'Available',
    latitude: null,
    longitude: null,
    features: []
  });
  
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [existingImages, setExistingImages] = useState([]);
  
  // Fetch property details when ID is available
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      router.push('/login?redirect=/my-properties');
      return;
    }
    
    const parsedUser = JSON.parse(loggedInUser);
    setUser(parsedUser);
    
    if (parsedUser.user_type !== 'Realtor' && parsedUser.user_type !== 'Admin') {
      router.push('/');
      return;
    }
    
    if (id) {
      fetchPropertyDetails(id, parsedUser.id);
    }
  }, [id, router]);
  
  const fetchPropertyDetails = async (propertyId, userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/properties/${propertyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      
      const data = await response.json();
      
      const parsedUser = JSON.parse(localStorage.getItem('user'));
      const isAdmin = parsedUser.user_type === 'Admin';
      const isOwner = data.realtor && data.realtor.id === userId;
      
      if (!isAdmin && !isOwner) {
        throw new Error('You do not have permission to edit this property');
      }
      
      setFormData({
        title: data.title,
        description: data.description,
        price: data.price,
        price_type: data.price_type,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        property_type: data.property_type,
        year_built: data.year_built || '',
        status: data.status,
        latitude: data.latitude,
        longitude: data.longitude,
        features: data.features || []
      });
      
      if (data.images && data.images.length > 0) {
        const primaryImage = data.images.find(img => img.is_primary) || data.images[0];
        setMainImagePreview(primaryImage.url);
        
        const otherImages = data.images.filter(img => img.id !== primaryImage.id);
        const previews = otherImages.map(img => img.url);
        setAdditionalImagePreviews(previews);
        
        setExistingImages(data.images);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching property:', err);
      setError(err.message || 'Failed to load property details');
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAdditionalImages([...additionalImages, ...files]);
      
      const newPreviews = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          if (newPreviews.length === files.length) {
            setAdditionalImagePreviews([...additionalImagePreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAdditionalImage = (index) => {
    const updatedImages = [...additionalImages];
    const updatedPreviews = [...additionalImagePreviews];
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setAdditionalImages(updatedImages);
    setAdditionalImagePreviews(updatedPreviews);
  };
  
  const handleRemoveExistingImage = (imageId) => {
    const imageToRemove = existingImages.find(img => img.id === imageId);
    if (imageToRemove) {
      if (imageToRemove.is_primary) {
        setMainImagePreview('');
      } else {
        const updatedPreviews = additionalImagePreviews.filter(url => url !== imageToRemove.url);
        setAdditionalImagePreviews(updatedPreviews);
      }
      
      const newExistingImages = existingImages.filter(img => img.id !== imageId);
      setExistingImages(newExistingImages);
      setImagesToDelete([...imagesToDelete, imageId]);
    }
  };
  
  const handleFeatureChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [name]: value
    };
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };
  
  const addFeatureField = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { feature_name: '', feature_value: '' }]
    });
  };
  
  const removeFeatureField = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };
  
  const handleLocationSelected = (location) => {
    setFormData({
      ...formData,
      latitude: location.lat,
      longitude: location.lng
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitLoading(true);
      setMessage({ type: '', content: '' });
      
      // Create FormData object
      const propertyData = new FormData();
      
      // Create a property object with all the form data
      const propertyObj = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        price_type: formData.price_type,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        property_type: formData.property_type,
        year_built: formData.year_built,
        status: formData.status,
        latitude: formData.latitude,
        longitude: formData.longitude,
        features: formData.features,
        imagesToDelete: imagesToDelete
      };
      
      // Add the property object as a JSON string
      propertyData.append('property', JSON.stringify(propertyObj));
      
      // Add realtor_id (current user)
      propertyData.append('realtor_id', user.id);
      
      // Add main image if provided
      if (mainImage) {
        propertyData.append('mainImage', mainImage);
      }
      
      // Add additional images if provided
      additionalImages.forEach((image, index) => {
        propertyData.append(`additionalImage_${index}`, image);
      });
      
      // Get user data for authorization
      const userData = JSON.stringify(user);
      const userToken = Buffer.from(userData).toString('base64');
      
      // Send update request
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        body: propertyData,
        headers: {
          // Use base64-encoded user data instead of token
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update property');
      }
      
      // Success message
      setMessage({ type: 'success', content: 'Property updated successfully!' });
      
      // Redirect to property page after delay
      setTimeout(() => {
        router.push(`/properties/${id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error updating property:', err);
      setMessage({ type: 'error', content: err.message || 'Failed to update property. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Edit Property | SmartEstate</title>
          <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Edit Property | SmartEstate</title>
        <meta name="description" content="Edit your property listing" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Edit Property</h1>
          <p className={styles.pageDescription}>Update your property listing information</p>
        </div>
        
        {message.content && (
          <div className={`${styles.alert} ${styles[message.type]}`}>
            {message.type === 'success' ? (
              <i className="bx bx-check-circle"></i>
            ) : (
              <i className="bx bx-error-circle"></i>
            )}
            {message.content}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.propertyForm}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.formLabel}>Property Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Enter a descriptive title for your property"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.formLabel}>Description*</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={styles.formTextarea}
                placeholder="Provide a detailed description of the property"
                rows="5"
                required
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="price" className={styles.formLabel}>Price*</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Property price"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="price_type" className={styles.formLabel}>Price Type*</label>
                <select
                  id="price_type"
                  name="price_type"
                  value={formData.price_type}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="Sale">For Sale</option>
                  <option value="Rent">For Rent</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="property_type" className={styles.formLabel}>Property Type*</label>
                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Studio">Studio</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="bedrooms" className={styles.formLabel}>Bedrooms*</label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Number of bedrooms"
                  min="0"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="bathrooms" className={styles.formLabel}>Bathrooms*</label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Number of bathrooms"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="area" className={styles.formLabel}>Area (sq ft)*</label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Property size in square feet"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="year_built" className={styles.formLabel}>Year Built</label>
                <input
                  type="number"
                  id="year_built"
                  name="year_built"
                  value={formData.year_built}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Construction year"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.formLabel}>Status*</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Pending">Pending</option>
                  <option value="Rented">Rented</option>
                  <option value="Off Market">Off Market</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Location</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Map Location*</label>
              <p className={styles.fieldDescription}>Select the exact location of your property on the map</p>
              <LocationPicker 
                initialLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
                onLocationSelected={handleLocationSelected}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="address" className={styles.formLabel}>Street Address*</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Full street address"
                required
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="city" className={styles.formLabel}>City*</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="City"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="state" className={styles.formLabel}>State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="State/Province"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="zip_code" className={styles.formLabel}>ZIP Code</label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="ZIP/Postal code"
                />
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Features & Amenities</h2>
            <p className={styles.sectionDescription}>Add key features and amenities of your property</p>
            
            {formData.features.map((feature, index) => (
              <div key={index} className={styles.featureRow}>
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="feature_name"
                    value={feature.feature_name}
                    onChange={(e) => handleFeatureChange(index, e)}
                    className={styles.formInput}
                    placeholder="Feature name (e.g. Garage, Pool)"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <input
                    type="text"
                    name="feature_value"
                    value={feature.feature_value}
                    onChange={(e) => handleFeatureChange(index, e)}
                    className={styles.formInput}
                    placeholder="Value (e.g. Yes, 2-car)"
                  />
                </div>
                
                {index > 0 && (
                  <button 
                    type="button" 
                    className={styles.removeFeatureButton}
                    onClick={() => removeFeatureField(index)}
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                )}
              </div>
            ))}
            
            <button 
              type="button" 
              className={styles.addFeatureButton}
              onClick={addFeatureField}
            >
              <i className="bx bx-plus"></i> Add Feature
            </button>
          </div>
          
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Property Images</h2>
            
            <div className={styles.imageUploadSection}>
              <div className={styles.mainImageUpload}>
                <h3 className={styles.imageTitle}>Main Image*</h3>
                <label htmlFor="mainImage" className={styles.imageUploadLabel}>
                  {mainImagePreview ? (
                    <div className={styles.imagePreviewContainer}>
                      <img src={mainImagePreview} alt="Main property view" className={styles.imagePreview} />
                      <div className={styles.imageOverlay}>
                        <span>Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <i className="bx bx-image-add"></i>
                      <span>Upload Main Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="mainImage"
                    name="mainImage"
                    onChange={handleMainImageChange}
                    className={styles.fileInput}
                    accept="image/*"
                  />
                </label>
                <p className={styles.imageHelp}>This will be the featured image of your property</p>
              </div>
              
              <div className={styles.additionalImagesUpload}>
                <h3 className={styles.imageTitle}>Additional Images</h3>
                
                <div className={styles.imageGrid}>
                  {additionalImagePreviews.map((preview, index) => (
                    <div key={index} className={styles.additionalImageContainer}>
                      <img 
                        src={preview} 
                        alt={`Property view ${index + 1}`} 
                        className={styles.additionalImagePreview} 
                      />
                      <button 
                        type="button" 
                        className={styles.removeImageButton}
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                  
                  <label htmlFor="additionalImages" className={styles.additionalImageUploadLabel}>
                    <div className={styles.uploadPlaceholder}>
                      <i className="bx bx-plus"></i>
                      <span>Add Images</span>
                    </div>
                    <input
                      type="file"
                      id="additionalImages"
                      name="additionalImages"
                      onChange={handleAdditionalImagesChange}
                      className={styles.fileInput}
                      accept="image/*"
                      multiple
                    />
                  </label>
                </div>
                <p className={styles.imageHelp}>You can upload multiple images of the property (interior, exterior, etc.)</p>
              </div>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="bx bx-save"></i>
                  Update Property
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}