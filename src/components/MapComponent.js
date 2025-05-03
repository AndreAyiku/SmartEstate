import { useState, useEffect, useRef } from 'react';
import styles from '@Map.module.css';

const MapComponent = ({ 
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 12,
  markers = [],
  onMarkerClick = null,
  height = '400px',
  width = '100%'
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);

  // Load Google Maps API
  useEffect(() => {
    console.log('Checking if Google Maps API needs to be loaded');
    
    // If Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      setGoogleLoaded(true);
      return;
    }

    // API Key check
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API Key is missing');
      setError('Missing API Key: Please add your Google Maps API key to .env.local');
      return;
    }

    console.log('Loading Google Maps API');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
      setGoogleLoaded(true);
    };
    
    script.onerror = (e) => {
      console.error('Error loading Google Maps API:', e);
      setError('Failed to load Google Maps API. Please check your API key and network connection.');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up script if component unmounts during loading
      const loadedScript = document.getElementById('google-maps-script');
      if (loadedScript) {
        loadedScript.remove();
      }
    };
  }, []);

  // Initialize map once API is loaded
  useEffect(() => {
    if (!googleLoaded || !mapRef.current) return;
    
    try {
      console.log('Initializing map with center:', center);
      const newMap = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      });
      
      setMap(newMap);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError(`Failed to initialize map: ${err.message}`);
    }
  }, [googleLoaded, center, zoom]);
  
  // Update markers when they change
  useEffect(() => {
    if (!map || !markers.length) return;
    
    console.log(`Creating ${markers.length} markers`);
    
    // Clear existing markers
    mapMarkers.forEach(marker => marker.setMap(null));
    
    // Create new markers
    const newMarkers = markers.map(markerData => {
      try {
        if (!markerData.lat || !markerData.lng) {
          console.warn('Invalid marker data:', markerData);
          return null;
        }
        
        const marker = new window.google.maps.Marker({
          position: { 
            lat: parseFloat(markerData.lat), 
            lng: parseFloat(markerData.lng) 
          },
          map,
          title: markerData.title || '',
          animation: window.google.maps.Animation.DROP
        });
        
        // Add click event listener
        if (onMarkerClick) {
          marker.addListener('click', () => {
            onMarkerClick(markerData);
          });
        }
        
        // Add info window if content is provided
        if (markerData.infoContent) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.infoContent
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }
        
        return marker;
      } catch (err) {
        console.error('Error creating marker:', err);
        return null;
      }
    }).filter(Boolean); // Filter out null markers
    
    setMapMarkers(newMarkers);
  }, [map, markers, onMarkerClick]);

  // Update center and zoom when they change
  useEffect(() => {
    if (!map) return;
    
    try {
      map.setCenter(center);
      map.setZoom(zoom);
    } catch (err) {
      console.error('Error updating map center/zoom:', err);
    }
  }, [map, center, zoom]);

  // Display error state
  if (error) {
    return (
      <div className={styles.mapError} style={{ height, width }}>
        <div className={styles.errorContent}>
          <i className="bx bx-map-alt"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer} style={{ height, width }}>
      {!googleLoaded && (
        <div className={styles.mapLoading}>
          <div className={styles.spinner}></div>
          <p>Loading map...</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className={styles.map} 
        style={{ height: '100%', width: '100%', visibility: googleLoaded ? 'visible' : 'hidden' }}
      />
    </div>
  );
};

export default MapComponent;