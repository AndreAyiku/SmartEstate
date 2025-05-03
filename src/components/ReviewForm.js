import { useState } from 'react';
import StarRating from './StarRating';
import styles from '../styles/ReviewForm.module.css';

const ReviewForm = ({ realtorId, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRatingChange = (value) => {
    setRating(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('You must be logged in to submit a review');
        setIsSubmitting(false);
        return;
      }
      
      const user = JSON.parse(userData);
      const userToken = Buffer.from(JSON.stringify(user)).toString('base64');
      
      // Submit review to API
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          realtor_id: realtorId,
          rating,
          review_text: reviewText
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }
      
      // Success
      setSuccess('Your review has been submitted successfully!');
      setRating(0);
      setReviewText('');
      
      // Notify parent component
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reviewFormContainer}>
      <h3 className={styles.formTitle}>Write a Review</h3>
      
      {error && (
        <div className={styles.errorMessage}>
          <i className="bx bx-error-circle"></i>
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.successMessage}>
          <i className="bx bx-check-circle"></i>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.reviewForm}>
        <div className={styles.formGroup}>
          <label className={styles.ratingLabel}>Your Rating*</label>
          <StarRating initialRating={rating} onChange={handleRatingChange} />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="reviewText" className={styles.textAreaLabel}>Your Review</label>
          <textarea
            id="reviewText"
            className={styles.reviewTextArea}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this realtor (optional)"
            rows={5}
          />
        </div>
        
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="bx bx-loader-alt bx-spin"></i>
              Submitting...
            </>
          ) : (
            <>
              <i className="bx bx-send"></i>
              Submit Review
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;