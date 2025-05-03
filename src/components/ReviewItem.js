import { useState } from 'react';
import StarRating from './StarRating';
import styles from '../styles/ReviewItem.module.css';

const ReviewItem = ({ review, currentUser, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setError('');
      
      // Get user token for authentication
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Authentication error. Please log in again.');
        return;
      }
      
      const user = JSON.parse(userData);
      const userToken = Buffer.from(JSON.stringify(user)).toString('base64');
      
      // Send delete request
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete review');
      }
      
      // Notify parent component
      if (onDelete) {
        onDelete(review.id);
      }
      
    } catch (err) {
      console.error('Error deleting review:', err);
      setError(err.message || 'Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if current user can delete this review (own review or admin)
  const canDelete = currentUser && (
    currentUser.id === review.reviewer_id || 
    currentUser.user_type === 'Admin'
  );
  
  return (
    <div className={styles.reviewCard}>
      {error && (
        <div className={styles.errorMessage}>
          <i className="bx bx-error-circle"></i>
          {error}
        </div>
      )}
      
      <div className={styles.reviewHeader}>
        <div className={styles.reviewerInfo}>
          <div className={styles.reviewerAvatar}>
            {review.reviewer_profile_picture ? (
              <img 
                src={review.reviewer_profile_picture} 
                alt={review.reviewer_name} 
                className={styles.avatarImage} 
              />
            ) : (
              <i className="bx bx-user-circle"></i>
            )}
          </div>
          <div>
            <h4 className={styles.reviewerName}>{review.reviewer_name}</h4>
            <StarRating initialRating={review.rating} readOnly={true} />
          </div>
        </div>
        <div className={styles.reviewMeta}>
          <span className={styles.reviewDate}>
            {formatDate(review.created_at)}
          </span>
          
          {canDelete && (
            <button 
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <i className="bx bx-loader-alt bx-spin"></i>
              ) : (
                <i className="bx bx-trash"></i>
              )}
            </button>
          )}
        </div>
      </div>
      
      {review.review_text && (
        <p className={styles.reviewText}>{review.review_text}</p>
      )}
    </div>
  );
};

export default ReviewItem;