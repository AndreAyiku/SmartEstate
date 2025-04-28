import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/RealtorProfile.module.css';
import homeStyles from '../../styles/Home.module.css';
import Navigation from '@/components/Navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [profileUser, setProfileUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemType, setItemType] = useState('');
  
  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setCurrentUser(JSON.parse(loggedInUser));
    }
    
    // Fetch user details when ID is available
    if (id) {
      fetchUserDetails();
      fetchUserItems();
    }
  }, [id, currentPage]);
  
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const data = await response.json();
      setProfileUser(data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserItems = async () => {
    try {
      const response = await fetch(`/api/users/${id}/items?page=${currentPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user items');
      }
      
      const data = await response.json();
      setItems(data.items);
      setItemType(data.itemType);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching user items:', err);
      setError('Failed to load user items. Please try again.');
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    router.push('/');
  };
  
  const handleMessageUser = () => {
    if (!currentUser) {
      // Redirect to login if not logged in
      router.push(`/login?redirect=profile/${id}`);
      return;
    }
    
    // Navigate to message page
    router.push(`/messages/new?userId=${id}`);
  };
  
  const handleAddProperty = () => {
    router.push('/AddProperty');
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };
  
  // Handle adding to favorites
  const handleAddToFavorite = async (propertyId) => {
    // Check if user is logged in
    if (!currentUser) {
      router.push(`/login?redirect=profile/${id}`);
      return;
    }
    
    try {
      // Logic for adding to favorites would go here
      // This would typically involve an API call to your backend
      alert(`Property ${propertyId} added to favorites!`);
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
      <Navigation />
        <div className={styles.errorContainer}>
          <i className="bx bx-error-circle"></i>
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button onClick={fetchUserDetails} className={styles.primaryButton}>
            Try Again
          </button>
          <Link href="/" className={styles.secondaryButton}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return null;
  }
  
  // Check if logged-in user is the profile owner
  const isOwnProfile = currentUser && currentUser.id === parseInt(id);
  const isRealtor = profileUser.user_type === 'Realtor';
  
  return (
    <div className={styles.container}>
      <Head>
        <title>{profileUser.name} | Smart Real Estate</title>
        <meta name="description" content={`${profileUser.name} - Profile on Smart Real Estate`} />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> {' > '} 
          {isRealtor ? (
            <>
              <Link href="/realtors">Realtors</Link> {' > '} 
            </>
          ) : (
            <>
              <Link href="/users">Users</Link> {' > '} 
            </>
          )}
          <span>{profileUser.name}</span>
        </div>
        
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <div className={styles.profileAvatar}>
              {profileUser.profile_picture ? (
                <img 
                  src={profileUser.profile_picture} 
                  alt={profileUser.name}
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.defaultAvatar}>
                  <i className="bx bx-user"></i>
                </div>
              )}
            </div>
            <div className={styles.profileDetails}>
              <h1>{profileUser.name}</h1>
              <p className={styles.userTitle}>
                {isRealtor ? 'Real Estate Professional' : 'Member'}
              </p>
              <div className={styles.contactInfo}>
  <p><i className="bx bx-envelope"></i> {profileUser.email}</p>
  {/* Only show phone if it exists */}
  {profileUser.phone && (
    <p><i className="bx bx-phone"></i> {profileUser.phone}</p>
  )}
</div>
              {!isOwnProfile ? (
                <button 
                  className={styles.primaryButton}
                  onClick={handleMessageUser}
                >
                  <i className="bx bx-message-square-detail"></i> Message {isRealtor ? 'Realtor' : 'User'}
                </button>
              ) : (
                <>
                  {isRealtor ? (
                    <button 
                      className={styles.primaryButton}
                      onClick={handleAddProperty}
                    >
                      <i className="bx bx-plus-circle"></i> Add New Property
                    </button>
                  ) : (
                    <button 
                      className={styles.primaryButton}
                      onClick={() => router.push('/account/edit')}
                    >
                      <i className="bx bx-edit"></i> Edit Profile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className={styles.statsCards}>
            {isRealtor ? (
              // Realtor stats
              <>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bx bx-building-house"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{profileUser.totalProperties}</h3>
                    <p>Properties</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bx bx-dollar"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{profileUser.totalSales}</h3>
                    <p>Total Sales</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bx bx-star"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{profileUser.averageRating.toFixed(1)}</h3>
                    <p>Average Rating</p>
                  </div>
                </div>
              </>
            ) : (
              // Regular user stats
              <>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bx bx-heart"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{profileUser.totalFavorites}</h3>
                    <p>Favorites</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bx bx-calendar"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>{profileUser.totalViewings}</h3>
                    <p>Property Viewings</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <i className="bx bx-time"></i>
                  </div>
                  <div className={styles.statContent}>
                    <h3>Member</h3>
                    <p>Account Type</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className={styles.aboutSection}>
            <h2>About {profileUser.name}</h2>
            <p>{profileUser.bio || 'No bio available.'}</p>
          </div>
          
          {/* Item section - shows properties for realtors or favorites for users */}
          <div className={styles.itemsSection}>
            <h2>
              {isRealtor 
                ? `Properties by ${profileUser.name}` 
                : `${profileUser.name}'s Favorite Properties`}
            </h2>
            
            {items.length === 0 ? (
              <div className={styles.noItems}>
                <i className="bx bx-search-alt"></i>
                <h3>No {itemType} available</h3>
                <p>
                  {isRealtor 
                    ? "This realtor has no listed properties at the moment." 
                    : "This user hasn't added any properties to favorites yet."}
                </p>
              </div>
            ) : (
              <>
                <div className={styles.itemsGrid}>
                  {items.map((property) => (
                    <div key={property.id} className={styles.propertyCard}>
                      <div className={styles.propertyImageContainer}>
                        <img src={property.image} alt={property.title} className={styles.propertyImage} />
                        <div className={styles.propertyType}>{property.type}</div>
                        {!isOwnProfile && (
                          <button 
                            className={styles.favoriteButton}
                            onClick={() => handleAddToFavorite(property.id)}
                          >
                            <i className="bx bx-heart"></i>
                          </button>
                        )}
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
                  ))}
                </div>
                
                {totalPages > 1 && (
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
              </>
            )}
          </div>
          
          {/* Reviews section - only show for realtors */}
          {isRealtor && profileUser.reviews && profileUser.reviews.length > 0 && (
            <div className={styles.reviewsSection}>
              <h2>Reviews</h2>
              <div className={styles.reviewsList}>
                {profileUser.reviews.map((review, index) => (
                  <div key={index} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewerInfo}>
                        <h4>{review.reviewer_name}</h4>
                        <div className={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={`bx ${i < review.rating ? 'bxs-star' : 'bx-star'}`}></i>
                          ))}
                        </div>
                      </div>
                      <span className={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className={styles.reviewText}>{review.review_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* For regular users, maybe show their recent viewings or other activity */}
          {!isRealtor && isOwnProfile && profileUser.totalViewings > 0 && (
            <div className={styles.activitySection}>
              <h2>Recent Activity</h2>
              <div className={styles.activityList}>
                <p>You have {profileUser.totalViewings} scheduled property viewings.</p>
                <Link href="/account/viewings" className={styles.viewAllButton}>
                  View All Appointments <i className="bx bx-right-arrow-alt"></i>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} SmartEstate. All rights reserved.</p>
      </footer>
    </div>
  );
}