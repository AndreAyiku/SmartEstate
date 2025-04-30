import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/FavoriteButton.module.css';

const FavoriteButton = ({ propertyId, initialFavorited = false, onToggle = null }) => {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If initialFavorited changes externally, update the state
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get user from localStorage
    const userJSON = localStorage.getItem('user');
    if (!userJSON) {
      // Redirect to login if not logged in
      router.push('/login?redirect=' + router.asPath);
      return;
    }
    
    try {
      const user = JSON.parse(userJSON);
      setLoading(true);
      
      if (favorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${propertyId}?userId=${user.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id, propertyId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to add to favorites');
        }
      }
      
      // Toggle the favorited state
      setFavorited(!favorited);
      
      // Call the onToggle callback if provided
      if (onToggle) {
        onToggle(propertyId, !favorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      className={`${styles.favoriteButton} ${favorited ? styles.favorited : ''} ${loading ? styles.loading : ''}`}
      onClick={handleToggleFavorite}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      disabled={loading}
    >
      {loading ? (
        <i className="bx bx-loader-alt bx-spin"></i>
      ) : favorited ? (
        <i className="bx bxs-heart"></i>
      ) : (
        <i className="bx bx-heart"></i>
      )}
    </button>
  );
};

export default FavoriteButton;