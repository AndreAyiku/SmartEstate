import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/AddProperty.module.css';
import MobileMenu from '../pages/MobileMenu';

export default function AddPropertyPage() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_type: 'Sale',
    location: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    property_type: '',
    year_built: '',
    status: 'Available',
    features: [{ feature_name: '', feature_value: '' }]
  });
  
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);
      setUser(userData);
    } else {
      // Redirect to login page if not logged in
      router.push('/login?redirect=add-property');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleClickOutside = (e) => {
    if (showDropdown && !e.target.closest(`.${styles.userMenu}`)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle feature changes
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

  // Add a new feature field
  const addFeatureField = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { feature_name: '', feature_value: '' }]
    });
  };

  // Remove a feature field
  const removeFeatureField = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };

  // Handle main image upload
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle additional images upload
  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAdditionalImages([...additionalImages, ...files]);
      
      // Create preview URLs for new images
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

  // Remove additional image
  const removeAdditionalImage = (index) => {
    const updatedImages = [...additionalImages];
    const updatedPreviews = [...additionalImagePreviews];
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setAdditionalImages(updatedImages);
    setAdditionalImagePreviews(updatedPreviews);
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!mainImage) {
      setMessage({ type: 'error', content: 'Please upload a main image for the property' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setMessage({ type: '', content: '' });
      
      // Create FormData object to send images
      const propertyData = new FormData();
      
      // Add form data to FormData object
      for (const key in formData) {
        if (key === 'features') {
          // Handle features separately
          propertyData.append('features', JSON.stringify(formData.features));
        } else {
          propertyData.append(key, formData[key]);
        }
      }
      
      // Add realtor_id (current user)
      propertyData.append('realtor_id', user.id);
      
      // Add images
      propertyData.append('mainImage', mainImage);
      additionalImages.forEach((image, index) => {
        propertyData.append(`additionalImage_${index}`, image);
      });
      
      // Send data to API
      const response = await fetch('/api/properties/add', {
        method: 'POST',
        body: propertyData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add property');
      }
      
      // Success message
      setMessage({ type: 'success', content: 'Property added successfully!' });
      
      // Reset form after successful submission
      setTimeout(() => {
        router.push(`/properties/${data.propertyId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding property:', error);
      setMessage({ type: 'error', content: error.message || 'An error occurred while adding the property' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Add Property | Smart Real Estate</title>
        <meta name="description" content="Add a new property listing on Smart Real Estate" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navbarLeft}>
          <Link href="/" className={styles.logo}>
            <i className="bx bxs-building-house"></i> SmartEstate
          </Link>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/ai-chatbot" className={styles.navLink}>
            AI Chatbot
          </Link>
          <Link href="/maps" className={styles.navLink}>
            Maps
          </Link>
          <Link href="/properties" className={styles.navLink}>
            Properties
          </Link>
          <Link href="/favorites" className={styles.navLink}>
            Favorites
          </Link>
        </div>

        <div className={styles.navbarRight}>
          <div className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
            <i className="bx bx-menu"></i>
          </div>
          
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userProfile} onClick={toggleDropdown}>
                <span className={styles.welcomeUser}>Welcome, {user.username}</span>
                <i className={`bx ${showDropdown ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
              </div>
              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <Link href="/dashboard" className={styles.dropdownItem}>
                    Dashboard
                  </Link>
                  <Link href="/profile" className={styles.dropdownItem}>
                    Profile
                  </Link>
                  <Link href="/my-properties" className={styles.dropdownItem}>
                    My Properties
                  </Link>
                  <Link href="/messages" className={styles.dropdownItem}>
                    Messages
                  </Link>
                  <div className={styles.divider}></div>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.loginButton}>
                Login
              </Link>
              <Link href="/register" className={styles.registerButton}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        onLogout={handleLogout}
      />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Add New Property</h1>
          <p className={styles.pageDescription}>Fill out the form below to add a new property listing</p>
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
              <label htmlFor="location" className={styles.formLabel}>Location/Neighborhood*</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="e.g. Downtown, West End, etc."
                required
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="bx bx-loader-alt bx-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bx bx-save"></i>
                  Add Property
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.socialIcons}>
            <a href="#"><i className="bx bxl-facebook"></i></a>
            <a href="#"><i className="bx bxl-twitter"></i></a>
            <a href="#"><i className="bx bxl-instagram"></i></a>
            <a href="#"><i className="bx bxl-linkedin"></i></a>
          </div>
        </div>
        <p className={styles.footerText}>
          <span>Need more info?</span> 
          <a href="contact.html">Contact us</a> or explore <a href="services.html">Our Services</a>.
        </p>
      </footer>
    </div>
  );
}