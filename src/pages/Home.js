import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/HomePage.module.css';
import MobileMenu from '../pages/MobileMenu';
import Navigation from '@/components/Navigation';
import FavoriteButton from '@/components/FavoriteButton';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const router = useRouter();

  // Fetch properties with search and filter parameters
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string with filters
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('searchTerm', searchTerm);
      if (propertyType) queryParams.append('propertyType', propertyType);
      if (priceRange) queryParams.append('priceRange', priceRange);
      if (bedrooms) queryParams.append('bedrooms', bedrooms);
      if (bathrooms) queryParams.append('bathrooms', bathrooms);
      queryParams.append('page', currentPage);
      
      const response = await fetch(/api/properties?${queryParams.toString()});
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      const data = await response.json();
      setProperties(data.properties);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch properties when component mounts or filters change
  useEffect(() => {
    fetchProperties();
  }, [currentPage, searchTerm, propertyType, priceRange, bedrooms, bathrooms]);

  // Check if user is logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      try {
        const parsedUser = JSON.parse(loggedInUser);
        console.log('Parsed user from localStorage:', parsedUser); // Add this for debugging
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user'); // Remove invalid user data
      }
    }
  }, []);

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
    if (showDropdown && !e.target.closest(.${styles.userMenu})) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchProperties();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  // Check favorite status for displayed properties
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !properties.length) return;
      
      try {
        const propertyIds = properties.map(property => property.id).join(',');
        const response = await fetch(/api/favorites/check?userId=${user.id}&propertyIds=${propertyIds});
        
        if (!response.ok) {
          throw new Error('Failed to check favorite status');
        }
        
        const { favoriteStatus } = await response.json();
        
        // Update properties with favorite status
        setProperties(currentProperties => 
          currentProperties.map(property => ({
            ...property,
            favorited: favoriteStatus[property.id] || false
          }))
        );
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkFavoriteStatus();
  }, [user, properties.length]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Properties | Smart Real Estate</title>
        <meta name="description" content="Browse available properties on Smart Real Estate" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Navigation />

      {showMobileMenu && (
        <MobileMenu 
          isOpen={showMobileMenu} 
          onClose={() => setShowMobileMenu(false)} 
          user={user} // This should be the state variable that contains the user object
          onLogout={handleLogout} 
        />
      )}

      <main className={styles.main}>
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className={styles.searchBar}>
            <i className="bx bx-search"></i>
            <input
              type="text"
              placeholder="Search by location, property type, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className={styles.searchButton}>Search</button>
          </form>
          <div className={styles.searchFilters}>
            <select 
              className={styles.filterSelect}
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="">Property Type</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Villa">Villa</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Studio">Studio</option>
              <option value="Commercial">Commercial</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">Price Range</option>
              <option value="0-100000">$0 - $100,000</option>
              <option value="100000-250000">$100,000 - $250,000</option>
              <option value="250000-500000">$250,000 - $500,000</option>
              <option value="500000-1000000">$500,000 - $1,000,000</option>
              <option value="1000000">$1,000,000+</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            >
              <option value="">Bedrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            >
              <option value="">Bathrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </div>
        </div>

        <div className={styles.propertiesGrid}>
          {loading ? (
            // Loading state
            Array(6).fill(0).map((_, index) => (
              <div key={skeleton-${index}} className={${styles.propertyCard} ${styles.skeleton}}>
                <div className={styles.propertyImageContainer} style={{ backgroundColor: '#eee' }}></div>
                <div className={styles.propertyInfo}>
                  <div style={{ height: '24px', backgroundColor: '#eee', marginBottom: '10px', borderRadius: '4px' }}></div>
                  <div style={{ height: '18px', backgroundColor: '#eee', marginBottom: '15px', width: '60%', borderRadius: '4px' }}></div>
                  <div className={styles.propertyFeatures}>
                    <div style={{ height: '16px', backgroundColor: '#eee', width: '30%', borderRadius: '4px' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#eee', width: '30%', borderRadius: '4px' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#eee', width: '30%', borderRadius: '4px' }}></div>
                  </div>
                  <div className={styles.propertyPriceRow}>
                    <div style={{ height: '24px', backgroundColor: '#eee', width: '40%', borderRadius: '4px' }}></div>
                    <div style={{ height: '36px', backgroundColor: '#eee', width: '30%', borderRadius: '6px' }}></div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className={styles.noResults}>
              <i className="bx bx-error-circle"></i>
              <h3>Error loading properties</h3>
              <p>{error}</p>
              <button 
                onClick={fetchProperties} 
                className={styles.searchButton} 
                style={{ marginTop: '15px' }}
              >
                Try Again
              </button>
            </div>
          ) : properties.length > 0 ? (
            // Properties list
            properties.map((property) => (
              <div key={property.id} className={styles.propertyCard}>
                <div className={styles.propertyImageContainer}>
                  <img src={property.image} alt={property.title} className={styles.propertyImage} />
                  <div className={styles.propertyType}>{property.type}</div>
                  <FavoriteButton 
                    propertyId={property.id} 
                    initialFavorited={property.favorited || false}
                  />
                </div>
                <div className={styles.propertyInfo}>
                  <h3 className={styles.propertyTitle}>{property.title}</h3>
                  <p className={styles.propertyLocation}>
                    <i className="bx bx-map"></i> {property.location}
                  </p>
                  <div className={styles.propertyFeatures}>
                    <span><i className="bx bx-bed"></i> {property.bedrooms} Beds</span>
                    <span><i className="bx bx-bath"></i> {property.bathrooms} Baths</span>
                    <span><i className="bx bx-area"></i> {property.area}</span>
                  </div>
                  <div className={styles.propertyPriceRow}>
                    <p className={styles.propertyPrice}>{property.price}</p>
                    <Link href={/properties/${property.id}} className={styles.viewDetailsButton}>
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // No results
            <div className={styles.noResults}>
              <i className="bx bx-search-alt"></i>
              <h3>No properties found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {properties.length > 0 && totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton}
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="bx bx-chevron-left"></i>
            </button>
            
            {/* Display page numbers */}
            {[...Array(totalPages)].map((_, i) => {
              // Only show a few page numbers around the current page for better UX
              const pageNum = i + 1;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button 
                    key={pageNum}
                    className={${styles.paginationButton} ${currentPage === pageNum ? styles.active : ''}}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              } 
              // Show ellipsis for skipped pages
              else if (
                pageNum === currentPage - 2 || 
                pageNum === currentPage + 2
              ) {
                return <span key={pageNum} className={styles.paginationButton}>...</span>;
              }
              return null;
            })}
            
            <button 
              className={styles.paginationButton}
              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>
        )}
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