// pages/properties/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/PropertyDetails.module.css';
import homeStyles from '../../styles/Home.module.css';

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    
    // Fetch property details when ID is available
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/properties/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      
      const data = await response.json();
      setProperty(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching property details:', err);
      setError('Failed to load property details. Please try again.');
      setLoading(false);
    }
  };

  const handleContactRealtor = () => {
    if (!user) {
      // Redirect to login if not logged in
      router.push(`/login?redirect=properties/${id}`);
      return;
    }
    
    // Navigate to realtor's profile page
    router.push(`/profile/${property.realtor.id}`);
  };

  const handleScheduleViewing = () => {
    if (!user) {
      // Redirect to login if not logged in
      router.push(`/login?redirect=properties/${id}`);
      return;
    }
    
    // Logic to schedule a viewing
    router.push(`/schedule-viewing/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Loading Property | Smart Real Estate</title>
          <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
        </Head>
        
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Error | Smart Real Estate</title>
          <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
        </Head>
        
        <div className={styles.errorContainer}>
          <i className="bx bx-error-circle"></i>
          <h2>Error Loading Property</h2>
          <p>{error}</p>
          <button onClick={fetchPropertyDetails} className={styles.primaryButton}>
            Try Again
          </button>
          <Link href="/" className={styles.secondaryButton}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{property.title} | Smart Real Estate</title>
        <meta name="description" content={`${property.title} - ${property.formattedPrice} - ${property.bedrooms} beds, ${property.bathrooms} baths`} />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Using the navbar from Home.module.css */}
      <nav className={homeStyles.navbar}>
        <div className={homeStyles.navbarLeft}>
          <Link href="/" className={homeStyles.logo}>
            <i className="bx bxs-building-house"></i> SmartEstate
          </Link>
          <Link href="/" className={homeStyles.navLink}>
            Home
          </Link>
          <Link href="/properties" className={homeStyles.navLink}>
            Properties
          </Link>
          <Link href="/about" className={homeStyles.navLink}>
            About Us
          </Link>
          <Link href="/contact" className={homeStyles.navLink}>
            Contact
          </Link>
        </div>
        <div className={homeStyles.navbarRight}>
          {user ? (
            <>
              <span className={homeStyles.welcomeUser}>Welcome, {user.name}</span>
              <button onClick={handleLogout} className={homeStyles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={homeStyles.loginButton}>
                Login
              </Link>
              <Link href="/register" className={homeStyles.registerButton}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> {' > '} 
          <Link href="/properties">Properties</Link> {' > '} 
          <span>{property.title}</span>
        </div>

        <div className={styles.propertyDetailsContainer}>
          <div className={styles.gallerySection}>
            <div className={styles.mainImageContainer}>
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[activeImage].url} 
                  alt={property.title} 
                  className={styles.mainImage} 
                />
              ) : (
                <div className={styles.placeholderImage}>
                  <i className="bx bx-image"></i>
                  <p>No image available</p>
                </div>
              )}
            </div>
            
            {property.images && property.images.length > 1 && (
              <div className={styles.thumbnailsContainer}>
                {property.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`${styles.thumbnailItem} ${activeImage === index ? styles.active : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img 
                      src={image.url} 
                      alt={`Thumbnail ${index + 1}`} 
                      className={styles.thumbnailImage} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.detailsSection}>
            <div className={styles.mainDetails}>
              <div className={styles.titleSection}>
                <h1 className={styles.propertyTitle}>{property.title}</h1>
                <div className={styles.propertyLocation}>
                  <i className="bx bx-map"></i>
                  <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
                </div>
                <div className={styles.propertyPrice}>{property.formattedPrice}</div>
              </div>

              <div className={styles.propertyFeatures}>
                <div className={styles.featureCard}>
                  <i className="bx bx-bed"></i>
                  <span>{property.bedrooms}</span>
                  <p>Bedrooms</p>
                </div>
                <div className={styles.featureCard}>
                  <i className="bx bx-bath"></i>
                  <span>{property.bathrooms}</span>
                  <p>Bathrooms</p>
                </div>
                <div className={styles.featureCard}>
                  <i className="bx bx-area"></i>
                  <span>{property.formattedArea}</span>
                  <p>Area</p>
                </div>
                <div className={styles.featureCard}>
                  <i className="bx bx-calendar"></i>
                  <span>{property.year_built || 'N/A'}</span>
                  <p>Year Built</p>
                </div>
              </div>

              <div className={styles.descriptionSection}>
                <h2>Description</h2>
                <p>{property.description}</p>
              </div>

              {property.features && property.features.length > 0 && (
                <div className={styles.amenitiesSection}>
                  <h2>Amenities & Features</h2>
                  <div className={styles.amenitiesList}>
                    {property.features.map((feature, index) => (
                      <div key={index} className={styles.amenityItem}>
                        <i className="bx bx-check"></i>
                        <span>{feature.feature_name}: {feature.feature_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Property Gallery Section */}
              {property.images && property.images.length > 1 && (
                <div className={styles.propertyGallerySection}>
                  <h2>Property Gallery</h2>
                  <div className={styles.galleryGrid}>
                    {property.images.map((image, index) => (
                      <div 
                        key={index} 
                        className={styles.galleryItem}
                        onClick={() => setActiveImage(index)}
                      >
                        <img 
                          src={image.url} 
                          alt={`Property view ${index + 1}`}
                          className={styles.galleryImage} 
                        />
                        {image.is_primary && (
                          <span className={styles.primaryBadge}>Main</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.sidebarSection}>
              <div className={styles.agentCard}>
                <h3>Contact Agent</h3>
                <div className={styles.agentInfo}>
                  <div className={styles.agentAvatar}>
                    {property.realtor.profile_picture ? (
                      <img 
                        src={property.realtor.profile_picture} 
                        alt={property.realtor.name}
                        className={styles.agentImage}
                      />
                    ) : (
                      <i className="bx bx-user-circle"></i>
                    )}
                  </div>
                  <div className={styles.agentDetails}>
                    <h4>{property.realtor.name}</h4>
                    <p><i className="bx bx-envelope"></i> {property.realtor.email}</p>
                    <p><i className="bx bx-phone"></i> {property.realtor.phone}</p>
                  </div>
                </div>
                <div className={styles.agentActions}>
                  <button 
                    className={styles.primaryButton}
                    onClick={handleContactRealtor}
                  >
                    <i className="bx bx-user"></i> View Realtor Profile
                  </button>
                  <button 
                    className={styles.secondaryButton}
                    onClick={handleScheduleViewing}
                  >
                    <i className="bx bx-calendar"></i> Schedule Viewing
                  </button>
                </div>
              </div>

              <div className={styles.mapCard}>
                <h3>Location</h3>
                <div className={styles.mapPlaceholder}>
                  <i className="bx bx-map-alt"></i>
                  <p>Map View</p>
                  <small>{property.address}, {property.city}, {property.state}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} SmartEstate. All rights reserved.</p>
      </footer>
    </div>
  );
}