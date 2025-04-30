import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/HomePage.module.css';
import Navigation from '@/components/Navigation';
import FavoriteButton from '@/components/FavoriteButton';

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      try {
        const parsedUser = JSON.parse(loggedInUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user'); // Remove invalid user data
        router.push('/login?redirect=favorites');
      }
    } else {
      router.push('/login?redirect=favorites');
    }
  }, [router]);

  // Fetch favorites when user is loaded
  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, currentPage]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/favorites?userId=${user.id}&page=${currentPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await response.json();
      setFavorites(data.favorites);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites. Please try again.');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  const handleFavoriteToggle = (propertyId, isFavorited) => {
    if (!isFavorited) {
      // Remove the property from the list if it was unfavorited
      setFavorites(currentFavorites => currentFavorites.filter(property => property.id !== propertyId));
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>My Favorites | Smart Estate</title>
        <meta name="description" content="View your favorite properties on Smart Estate" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <Navigation />

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>
          <i className="bx bxs-heart" style={{ color: '#ef4444', marginRight: '12px' }}></i>
          My Favorite Properties
        </h1>

        <div className={styles.propertiesGrid}>
          {loading ? (
            // Loading state
            Array(6).fill(0).map((_, index) => (
              <div key={`skeleton-${index}`} className={`${styles.propertyCard} ${styles.skeleton}`}>
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
              <h3>Error loading favorites</h3>
              <p>{error}</p>
              <button 
                onClick={fetchFavorites} 
                className={styles.searchButton} 
                style={{ marginTop: '15px' }}
              >
                Try Again
              </button>
            </div>
          ) : favorites.length > 0 ? (
            // Favorites list
            favorites.map((property) => (
              <div key={property.id} className={styles.propertyCard}>
                <div className={styles.propertyImageContainer}>
                  <img src={property.image} alt={property.title} className={styles.propertyImage} />
                  <div className={styles.propertyType}>{property.type}</div>
                  <FavoriteButton 
                    propertyId={property.id} 
                    initialFavorited={true}
                    onToggle={handleFavoriteToggle}
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
                    <Link href={`/properties/${property.id}`} className={styles.viewDetailsButton}>
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // No favorites
            <div className={styles.noResults}>
              <i className="bx bx-heart"></i>
              <h3>No favorites yet</h3>
              <p>Properties you favorite will appear here</p>
              <Link href="/properties" className={styles.searchButton} style={{ marginTop: '15px', display: 'inline-block' }}>
                Browse Properties
              </Link>
            </div>
          )}
        </div>

        {favorites.length > 0 && totalPages > 1 && (
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
              const pageNum = i + 1;
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button 
                    key={pageNum}
                    className={`${styles.paginationButton} ${currentPage === pageNum ? styles.active : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              } 
              else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
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