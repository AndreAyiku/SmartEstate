/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * 
 * @param {Object} point1 - First point with lat and lng properties
 * @param {Object} point2 - Second point with lat and lng properties
 * @param {string} unit - Unit of distance ('miles' or 'km')
 * @returns {number} - Distance in specified unit
 */
export function calculateDistance(point1, point2, unit = 'miles') {
    // Earth's radius in miles and kilometers
    const EARTH_RADIUS = {
      miles: 3958.8,
      km: 6371.0
    };
    
    // Validate inputs
    if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
      throw new Error('Invalid coordinates provided');
    }
    
    const radius = EARTH_RADIUS[unit] || EARTH_RADIUS.miles;
    
    // Convert latitude and longitude from degrees to radians
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lng1Rad = (point1.lng * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const lng2Rad = (point2.lng * Math.PI) / 180;
    
    // Differences between coordinates
    const dLat = lat2Rad - lat1Rad;
    const dLng = lng2Rad - lng1Rad;
    
    // Haversine formula
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = radius * c;
    
    return distance;
  }
  
  /**
   * Get address components from Google Places API result
   * 
   * @param {Object} placeResult - Google Places API result
   * @returns {Object} - Address components
   */
  export function extractAddressComponents(placeResult) {
    // Initialize empty object to store components
    const components = {
      street_number: '',
      street_name: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      formatted_address: placeResult.formatted_address || ''
    };
    
    // Extract data from address components
    if (placeResult.address_components) {
      placeResult.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          components.street_number = component.long_name;
        }
        else if (types.includes('route')) {
          components.street_name = component.long_name;
        }
        else if (types.includes('locality')) {
          components.city = component.long_name;
        }
        else if (types.includes('administrative_area_level_1')) {
          components.state = component.short_name;
        }
        else if (types.includes('postal_code')) {
          components.zip_code = component.long_name;
        }
        else if (types.includes('country')) {
          components.country = component.long_name;
        }
      });
    }
    
    // Combine street number and name
    components.address = components.street_number 
      ? `${components.street_number} ${components.street_name}`
      : components.street_name;
    
    return components;
  }
  
  /**
   * Get nearby properties based on a central location
   * 
   * @param {Object} location - Central location with lat and lng properties
   * @param {number} radiusMiles - Search radius in miles
   * @returns {Promise<Array>} - Array of nearby properties
   */
  export async function getNearbyProperties(location, radiusMiles = 10) {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        lat: location.lat,
        lng: location.lng,
        distance: radiusMiles
      });
      
      const response = await fetch(`/api/maps/properties?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby properties');
      }
      
      const data = await response.json();
      return data.properties;
    } catch (error) {
      console.error('Error fetching nearby properties:', error);
      throw error;
    }
  }