import { useState, useEffect } from 'react';
import ReviewItem from './ReviewItem';
import StarRating from './StarRating';
import styles from '../styles/ReviewList.module.css';

const ReviewList = ({ realtorId, reviewsPerPage = 5 }) => {
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  
  // Fetch reviews on component mount and when page changes
  useEffect(() => {
    fetchReviews();
    
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, [realtorId, currentPage]);
  
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/users/${realtorId}/reviews?page=${currentPage}&limit=${reviewsPerPage}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch reviews');
      }
      
      const data = await response.json();
      
      setReviews(data.reviews);
      setTotalPages(data.pagination.totalPages);
      setTotalReviews(data.pagination.totalReviews);
      setAverageRating(data.stats.averageRating);
      setRatingDistribution(data.stats.ratingDistribution);
      
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleReviewDeleted = (reviewId) => {
    // Remove the deleted review from state
    setReviews(reviews.filter(review => review.id !== reviewId));
    
    // Refresh the reviews to update counts and pagination
    fetchReviews();
  };
  
  // Calculate rating percentages for the distribution bars
  const calculateRatingPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };
  
  if (loading && reviews.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading reviews...</p>
      </div>
    );
  }
  
  if (error && reviews.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <i className="bx bx-error-circle"></i>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className={styles.reviewListContainer}>
      <div className={styles.reviewStats}>
        <div className={styles.averageRating}>
          <h4>Average Rating</h4>
          <div className={styles.ratingValue}>
            <span>{averageRating.toFixed(1)}</span>
            <span className={styles.outOf}>/5</span>
          </div>
          <StarRating initialRating={Math.round(averageRating)} readOnly={true} />
          <p className={styles.totalReviews}>{totalReviews} reviews</p>
        </div>
        
        <div className={styles.ratingDistribution}>
          {Object.entries(ratingDistribution)
            .sort((a, b) => b[0] - a[0]) // Sort by stars (5 to 1)
            .map(([stars, count]) => (
              <div key={stars} className={styles.ratingBar}>
                <div className={styles.ratingStars}>
                  <span>{stars}</span> <i className="bx bxs-star"></i>
                </div>
                <div className={styles.ratingBarOuter}>
                  <div 
                    className={styles.ratingBarInner} 
                    style={{width: `${calculateRatingPercentage(count)}%`}}
                  ></div>
                </div>
                <div className={styles.ratingCount}>
                  {count}
                </div>
              </div>
            ))
          }
        </div>
      </div>
      
      {reviews.length === 0 ? (
        <div className={styles.noReviews}>
          <i className="bx bx-message-square-detail"></i>
          <p>No reviews yet. Be the first to leave a review!</p>
        </div>
      ) : (
        <>
          <div className={styles.reviewList}>
            {reviews.map(review => (
              <ReviewItem 
                key={review.id} 
                review={review} 
                currentUser={currentUser}
                onDelete={handleReviewDeleted}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bx bx-chevron-left"></i>
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                
                // Show current page and adjacent pages
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
                } else if (
                  pageNum === currentPage - 2 || 
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className={styles.paginationButton}>...</span>;
                }
                return null;
              })}
              
              <button 
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewList;