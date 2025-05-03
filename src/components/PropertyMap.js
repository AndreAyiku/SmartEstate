import { useState, useEffect, useRef } from 'react';
import styles from '@Map.module.css';

const PropertyMap = ({ property }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Load Google Maps API
    if (!window.google) {
      const googleMapScript = document.createElement('script');
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      googleMapScript.async = true;
      googleMapScript.defer = true;
      
      googleMapScript.addEventListener('load', () => {
        setLoaded(true);
      });
      
      googleMapScript.addEventListener('error', () => {
        setError('Failed to load Google Maps API. Please check your API key.');
      });
      
      document.body.appendChild(googleMapScript);
      
      return () => {
        document.body.removeChild(googleMapScript);
      };
    } else {
      setLoaded(true);
    }
  }, []);
  
  // Initialize the map once the API is loaded
  useEffect(() => {
    if (!loaded || !mapRef.current || !property) return;
    
    try {
      // Check if latitude and longitude exist and are valid numbers
      if (!property.latitude || !property.longitude) {
        setError('Property location coordinates not available');
        return;
      }
      
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        setError('Invalid property coordinates');
        return;
      }
      
      const mapOptions = {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true
      };
      
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setMap(newMap);
      
      // Add a marker for the property location
      new window.google.maps.Marker({
        position: { lat, lng },
        map: newMap,
        title: property.title || 'Property Location',
        animation: window.google.maps.Animation.DROP
      });
      
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  }, [loaded, property]);
  
  // If there's an error, show the error message
  if (error) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.mapError}>
          <i className="bx bx-map-alt"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // If the map is loading, show a loading indicator
  if (!loaded) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.mapLoading}>
          <div className={styles.spinner}></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.propertyMapContainer}>
      <h3>Property Location</h3>
      <div ref={mapRef} className={styles.propertyMapCanvas}></div>
    </div>
  );
};

export default PropertyMap;