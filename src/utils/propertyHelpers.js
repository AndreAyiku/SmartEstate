/**
 * Format a price with proper currency formatting
 * 
 * @param {number} price - The price to format
 * @param {string} priceType - "Sale" or "Rent"
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, priceType = 'Sale') => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return formattedPrice + (priceType === 'Rent' ? '/month' : '');
};

/**
 * Format area with proper units
 * 
 * @param {number} area - The area value
 * @returns {string} Formatted area string
 */
export const formatArea = (area) => {
  return `${Number(area).toLocaleString()} sq ft`;
};

/**
 * Get the CSS class name for a property status
 * 
 * @param {string} status - Property status
 * @returns {string} CSS class name
 */
export const getStatusClass = (status) => {
  switch (status) {
    case 'Available':
      return 'statusAvailable';
    case 'Sold':
      return 'statusSold';
    case 'Pending':
      return 'statusPending';
    case 'Rented':
      return 'statusRented';
    case 'Off Market':
      return 'statusOffMarket';
    default:
      return '';
  }
};

/**
 * Check if a user has permission to edit/delete a property
 * 
 * @param {Object} user - Current user object
 * @param {Object} property - Property object
 * @returns {boolean} True if user has permission
 */
export const hasPropertyPermission = (user, property) => {
  if (!user || !property) return false;
  
  // Admin can edit any property
  if (user.user_type === 'Admin') return true;
  
  // Realtor can only edit their own properties
  if (user.user_type === 'Realtor' && property.realtor_id === user.id) return true;
  
  return false;
};

/**
 * Create a property object from form data
 * 
 * @param {Object} formData - Data from property form
 * @returns {Object} Formatted property object
 */
export const createPropertyFromForm = (formData) => {
  return {
    title: formData.title,
    description: formData.description,
    price: parseFloat(formData.price),
    price_type: formData.priceType,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    zip_code: formData.zipCode,
    bedrooms: parseInt(formData.bedrooms),
    bathrooms: parseFloat(formData.bathrooms),
    area: parseFloat(formData.area),
    property_type: formData.propertyType,
    year_built: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
    status: formData.status,
    latitude: formData.latitude,
    longitude: formData.longitude,
    features: formData.features
  };
};

/**
 * Validate property form data
 * 
 * @param {Object} data - Property form data
 * @returns {Object} Result with isValid and error message
 */
export const validatePropertyData = (data) => {
  // Basic validation
  if (!data.title || data.title.trim() === '') {
    return { isValid: false, error: 'Property title is required' };
  }
  
  if (!data.description || data.description.trim() === '') {
    return { isValid: false, error: 'Description is required' };
  }
  
  if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
    return { isValid: false, error: 'Valid price is required' };
  }
  
  if (!data.address || data.address.trim() === '') {
    return { isValid: false, error: 'Address is required' };
  }
  
  if (!data.city || data.city.trim() === '') {
    return { isValid: false, error: 'City is required' };
  }
  
  if (!data.bedrooms || isNaN(parseInt(data.bedrooms)) || parseInt(data.bedrooms) < 0) {
    return { isValid: false, error: 'Valid number of bedrooms is required' };
  }
  
  if (!data.bathrooms || isNaN(parseFloat(data.bathrooms)) || parseFloat(data.bathrooms) < 0) {
    return { isValid: false, error: 'Valid number of bathrooms is required' };
  }
  
  if (!data.area || isNaN(parseFloat(data.area)) || parseFloat(data.area) <= 0) {
    return { isValid: false, error: 'Valid area is required' };
  }
  
  // All checks passed
  return { isValid: true, error: null };
};