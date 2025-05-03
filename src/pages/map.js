import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import MapComponent from '../components/MapComponent';
import Navigation from '../components/Navigation';
import styles from '../styles/Map.module.css';

export default function MapPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 40.7128, // Default to NYC
    lng: -74.0060
  });
  const [mapZoom, setMapZoom] = useState(12);
  
  // Filter states
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [distance, setDistance] = useState('');
  
  const router = useRouter();
  
  // Get user's location if they allow it
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userLoc);
          setMapCenter(userLoc); // Center map on user's location
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Continue without user location
        }
      );
    }
  }, []);
  
  // Fetch properties with coordinates
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log('Starting property fetch');
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (propertyType) params.append('type', propertyType);
        if (priceRange) params.append('priceRange', priceRange);
        if (distance && userLocation) {
          params.append('distance', distance);
          params.append('lat', userLocation.lat);
          params.append('lng', userLocation.lng);
        }
        
        console.log(`Fetching: /api/maps/properties?${params.toString()}`);
        const response = await fetch(`/api/maps/properties?${params.toString()}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.properties?.length || 0} properties`);
        
        // Check if we received valid data
        if (!data.properties || !Array.isArray(data.properties)) {
          throw new Error('Invalid response format from API');
        }
        
        setProperties(data.properties);
        
        // Only adjust map bounds if we have properties and Google Maps is loaded
        if (data.properties.length > 0 && !distance && window.google && window.google.maps) {
          try {
            // Calculate bounds to fit all properties
            const bounds = new window.google.maps.LatLngBounds();
            let hasValidCoordinates = false;
            
            data.properties.forEach(property => {
              if (property.latitude && property.longitude) {
                bounds.extend({
                  lat: parseFloat(property.latitude),
                  lng: parseFloat(property.longitude)
                });
                hasValidCoordinates = true;
              }
            });
            
            // If user location exists, include it in bounds
            if (userLocation) {
              bounds.extend(userLocation);
              hasValidCoordinates = true;
            }
            
            if (hasValidCoordinates) {
              // Get center that fits all markers
              const center = {
                lat: bounds.getCenter().lat(),
                lng: bounds.getCenter().lng()
              };
              
              setMapCenter(center);
            }
          } catch (err) {
            console.error('Error adjusting map bounds:', err);
            // Don't throw - this is not a critical error
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(`Failed to load properties: ${err.message}`);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch properties regardless of Google Maps loading state
    fetchProperties();
  }, [propertyType, priceRange, distance, userLocation]);
  
  // Create markers from properties
  const createMarkers = () => {
    if (!properties.length) return [];
    
    return properties.map((property) => ({
      lat: parseFloat(property.latitude),
      lng: parseFloat(property.longitude),
      title: property.title,
      property: property, // Store entire property object for reference
      infoContent: `
        <div class="${styles.mapInfoWindow}">
          <h4>${property.title}</h4>
          <p>${property.location}</p>
          <p class="${styles.propertyPrice}">${property.formattedPrice || `$${property.price.toLocaleString()}`}</p>
        </div>
      `
    }));
  };
  
  // Handle marker click
  const handleMarkerClick = (markerData) => {
    setSelectedProperty(markerData.property);
  };
  
  // Handle applying filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    // The useEffect will trigger a re-fetch with the new filter values
  };
  
  // Handle clearing filters
  const handleClearFilters = () => {
    setPropertyType('');
    setPriceRange('');
    setDistance('');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Property Map | Smart Real Estate</title>
        <meta name="description" content="Explore properties on the map" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.mapPageMain}>
        <div className={styles.mapHeader}>
          <h1>Property Map</h1>
          <p>Find properties by location</p>
        </div>
        
        <div className={styles.mapFilters}>
          <form onSubmit={handleApplyFilters}>
            <div className={styles.filterRow}>
              <select 
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Property Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Studio">Studio</option>
                <option value="Commercial">Commercial</option>
              </select>
              
              <select 
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Price Ranges</option>
                <option value="0-100000">Below $100,000</option>
                <option value="100000-250000">$100,000 - $250,000</option>
                <option value="250000-500000">$250,000 - $500,000</option>
                <option value="500000-1000000">$500,000 - $1,000,000</option>
                <option value="1000000-">Above $1,000,000</option>
              </select>
              
              <select 
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className={styles.filterSelect}
                disabled={!userLocation}
              >
                <option value="">Any Distance</option>
                <option value="1">Within 1 mile</option>
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
              </select>
              
              <div className={styles.filterButtons}>
                <button type="submit" className={styles.applyFilterButton}>
                  Apply Filters
                </button>
                <button 
                  type="button" 
                  className={styles.clearFilterButton}
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div className={styles.mapContent}>
          <div className={styles.mapContainer}>
            {loading ? (
              <div className={styles.mapLoading}>
                <div className={styles.spinner}></div>
                <p>Loading properties...</p>
              </div>
            ) : error ? (
              <div className={styles.mapError}>
                <div className={styles.errorContent}>
                  <i className="bx bx-error-circle"></i>
                  <p>{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className={styles.retryButton}
                  >
                    <i className="bx bx-refresh"></i> Retry
                  </button>
                </div>
              </div>
            ) : (
              <MapComponent
                center={mapCenter}
                zoom={mapZoom}
                markers={createMarkers()}
                onMarkerClick={handleMarkerClick}
                height="600px"
              />
            )}
          </div>
          
          {selectedProperty && (
            <div className={styles.propertyPreview}>
              <div className={styles.propertyPreviewHeader}>
                <h3>Property Details</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setSelectedProperty(null)}
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>
              
              <div className={styles.propertyCardMap}>
                <div className={styles.propertyImageContainer}>
                  {selectedProperty.image ? (
                    <img src={selectedProperty.image} alt={selectedProperty.title} className={styles.propertyImage} />
                  ) : (
                    <div className={styles.noImage}>
                      <i className="bx bx-building-house"></i>
                      <p>No image available</p>
                    </div>
                  )}
                  <div className={styles.propertyType}>{selectedProperty.property_type}</div>
                </div>
                
                <div className={styles.propertyInfo}>
                  <h4 className={styles.propertyTitle}>{selectedProperty.title}</h4>
                  <p className={styles.propertyLocation}>
                    <i className="bx bx-map"></i> {selectedProperty.location}
                  </p>
                  <div className={styles.propertyFeatures}>
                    <span><i className="bx bx-bed"></i> {selectedProperty.bedrooms} Beds</span>
                    <span><i className="bx bx-bath"></i> {selectedProperty.bathrooms} Baths</span>
                    <span><i className="bx bx-area"></i> {selectedProperty.area} sq ft</span>
                  </div>
                  <div className={styles.propertyPriceRow}>
                    <p className={styles.propertyPrice}>
                      {selectedProperty.formattedPrice || `$${selectedProperty.price.toLocaleString()}`}
                    </p>
                    <Link href={`/properties/${selectedProperty.id}`} className={styles.viewDetailsButton}>
                      View Details
                    </Link>
                  </div>
                  
                  {userLocation && selectedProperty.distance && (
                    <div className={styles.propertyDistance}>
                      <i className="bx bx-walk"></i>
                      <span>{selectedProperty.distance.toFixed(1)} miles away</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}