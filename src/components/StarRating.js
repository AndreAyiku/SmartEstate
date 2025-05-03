import { useState } from 'react';
import styles from '../styles/StarRating.module.css';

const StarRating = ({ initialRating = 0, onChange, readOnly = false }) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (readOnly) return;
    
    setRating(value);
    if (onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (readOnly) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  return (
    <div className={styles.starRating}>
      {[...Array(5)].map((_, index) => {
        const value = index + 1;
        return (
          <span
            key={index}
            className={`${styles.star} ${
              (hoverRating || rating) >= value ? styles.filled : ''
            } ${readOnly ? styles.readOnly : ''}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
          >
            <i className={`bx ${(hoverRating || rating) >= value ? 'bxs-star' : 'bx-star'}`}></i>
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;