import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/MobileMenu.module.css';

const MobileMenu = ({ isOpen, onClose, user, onLogout }) => {
  const router = useRouter();
  
  if (!isOpen) return null;
  
  // Function to handle profile navigation
  const handleProfileClick = (e) => {
    e.preventDefault();
    if (user && user.id) {
      // Close the menu first
      onClose();
      // Then navigate to the profile page
      router.push(`/profile/${user.id}`);
    } else {
      console.error("User ID is missing");
    }
  };

  return (
    <div className={styles.mobileMenuOverlay}>
      <div className={styles.mobileMenu}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.logo}>
            <i className="bx bxs-building-house"></i> SmartEstate
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div className={styles.mobileMenuContent}>
          <div className={styles.navigationLinks}>
            <Link href="/" className={styles.mobileNavLink} onClick={onClose}>
              Home
            </Link>
            <Link href="/maps" className={styles.mobileNavLink} onClick={onClose}>
              Maps
            </Link>
            <Link href="/properties" className={styles.mobileNavLink} onClick={onClose}>
              Properties
            </Link>
            <Link href="/favorites" className={styles.mobileNavLink} onClick={onClose}>
              Favorites
            </Link>
          </div>

          <div className={styles.mobileMenuDivider}></div>

          {user ? (
            <div className={styles.userSection}>
              <p className={styles.welcomeUser}>Welcome, {user.username}</p>
              {user.user_type === 'Admin' && (
                <Link href="/admin/dashboard" className={styles.userMenuItem} onClick={onClose}>
                  <i className="bx bxs-dashboard"></i> Admin Dashboard
                </Link>
              )}
              
              <button 
                className={styles.userMenuItem} 
                onClick={handleProfileClick}
              >
                <i className="bx bxs-user"></i> Profile
              </button>
              
              <Link href="/my-properties" className={styles.userMenuItem} onClick={onClose}>
                <i className="bx bxs-building"></i> My Properties
              </Link>
              <Link href="/messages" className={styles.userMenuItem} onClick={onClose}>
                <i className="bx bxs-message"></i> Messages
                {user.unreadMessageCount > 0 && (
                  <span className={styles.notificationBadge}>{user.unreadMessageCount}</span>
                )}
              </Link>
              <button 
                className={styles.logoutButton} 
                onClick={() => { 
                  onLogout(); 
                  onClose(); 
                }}
              >
                <i className="bx bx-log-out"></i> Logout
              </button>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login" className={styles.loginButton} onClick={onClose}>
                Login
              </Link>
              <Link href="/register" className={styles.registerButton} onClick={onClose}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;