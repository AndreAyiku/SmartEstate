import React from 'react';
import Link from 'next/link';
import styles from '../styles/MobileMenu.module.css';

const MobileMenu = ({ isOpen, onClose, user, onLogout }) => {
  if (!isOpen) return null;

  // Log the entire user object for debugging
  console.log("MobileMenu - Full user object:", user);

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
            <Link href="/ai-chatbot" className={styles.mobileNavLink} onClick={onClose}>
              AI Chatbot
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
              <Link href="/dashboard" className={styles.userMenuItem} onClick={onClose}>
                <i className="bx bxs-dashboard"></i> Dashboard
              </Link>
              
              {/* Directly use the user ID without any conditional logic */}
              <Link 
                href={`/profile/${user.id}`} 
                className={styles.userMenuItem} 
                onClick={onClose}
              >
                <i className="bx bxs-user"></i> Profile
              </Link>
              
              <Link href="/my-properties" className={styles.userMenuItem} onClick={onClose}>
                <i className="bx bxs-building"></i> My Properties
              </Link>
              <Link href="/messages" className={styles.userMenuItem} onClick={onClose}>
                <i className="bx bxs-message"></i> Messages
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