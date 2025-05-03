import { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import styles from '../../styles/Map.module.css';

const LocationPicker = ({ 
  initialLocation = null, 
  onLocationSelected = () => {}
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Default to a central location if no initial location is provided
  const defaultCenter = {
    lat: 40.7128, // NYC latitude
    lng: -74.0060  // NYC longitude
  };
  
  // Geocode the selected location to get address
  useEffect(() => {
    const geocodeLocation = async (lat, lng) => {
      if (!window.google || !window.google.maps) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await new Promise((resolve) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            resolve({ results, status });
          });
        });
        
        if (response.status === 'OK' && response.results[0]) {
          setAddress(response.results[0].formatted_address);
        } else {
          setAddress('');
          setError('Could not find address for this location.');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setAddress('');
        setError('Failed to get address information.');
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedLocation) {
      geocodeLocation(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);
  
  // Handle map click to update selected location
  const handleMapClick = (latLng) => {
    setSelectedLocation(latLng);
    onLocationSelected(latLng);
  };
  
  // Handle address search - MODIFIED to not use a form
  const handleAddressSearch = (e) => {
    e.preventDefault(); // Still prevent default behavior
    
    if (!address.trim() || !window.google || !window.google.maps) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const latLng = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        
        setSelectedLocation(latLng);
        onLocationSelected(latLng);
      } else {
        setError('Could not find this address. Please try again.');
      }
      setLoading(false);
    });
  };
  
  // Generate markers array if a location is selected
  const markers = selectedLocation ? [
    {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      title: 'Selected Location'
    }
  ] : [];
  
  return (
    <div className={styles.locationPickerContainer}>
      <div className={styles.searchBarContainer}>
        {/* CHANGED: form element to div */}
        <div className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <i className="bx bx-search"></i>
            <input 
              type="text"
              placeholder="Search for an address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={styles.searchInput}
            />
            <button 
              type="button" 
              className={styles.searchButton}
              disabled={loading}
              onClick={handleAddressSearch} // Direct click handler
            >
              {loading ? <i className="bx bx-loader-alt bx-spin"></i> : 'Search'}
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <i className="bx bx-error-circle"></i>
          <p>{error}</p>
        </div>
      )}
      
      <div className={styles.mapInstructions}>
        <i className="bx bx-info-circle"></i>
        <p>Click on the map to set the property location</p>
      </div>
      
      <MapComponent
        center={selectedLocation || defaultCenter}
        zoom={selectedLocation ? 16 : 12}
        markers={markers}
        onMapClick={handleMapClick}
        height="400px"
      />
      
      {selectedLocation && (
        <div className={styles.selectedLocationInfo}>
          <div className={styles.locationCoordinates}>
            <p><strong>Latitude:</strong> {selectedLocation.lat.toFixed(6)}</p>
            <p><strong>Longitude:</strong> {selectedLocation.lng.toFixed(6)}</p>
          </div>
          <div className={styles.locationAddress}>
            <p><strong>Address:</strong> {loading ? 'Loading...' : address || 'No address found'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;