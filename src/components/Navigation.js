import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/HomePage.module.css';
import MobileMenu from '../pages/MobileMenu';

const Navigation = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
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
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleClickOutside = (e) => {
    if (showDropdown && !e.target.closest(`.${styles.userMenu}`)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navbarLeft}>
          <Link href="/" className={styles.logo}>
            <i className="bx bxs-building-house"></i> SmartEstate
          </Link>
          <Link href="/Home" className={styles.navLink}>
            Home
          </Link>
          <Link href="/maps" className={styles.navLink}>
            Maps
          </Link>
          <Link href="/properties" className={styles.navLink}>
            Properties
          </Link>
          <Link href="/favorites" className={styles.navLink}>
            Favorites
          </Link>
        </div>

        <div className={styles.navbarRight}>
          <div className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
            <i className="bx bx-menu"></i>
          </div>
          
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userProfile} onClick={toggleDropdown}>
                <span className={styles.welcomeUser}>Welcome, {user.username}</span>
                <i className={`bx ${showDropdown ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
              </div>
              {showDropdown && (
                <div className={styles.dropdownMenu}>
                  <Link href="/dashboard" className={styles.dropdownItem}>
                    Dashboard
                  </Link>
                  <Link href={user && user.id ? `/profile/${user.id}` : '/login'} className={styles.dropdownItem}>
                    Profile
                  </Link>
                  <Link href="/my-properties" className={styles.dropdownItem}>
                    My Properties
                  </Link>
                  <Link href="/messages" className={styles.dropdownItem}>
                    Messages
                  </Link>
                  <div className={styles.divider}></div>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.loginButton}>
                Login
              </Link>
              <Link href="/register" className={styles.registerButton}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {showMobileMenu && (
        <MobileMenu 
          isOpen={showMobileMenu} 
          onClose={() => setShowMobileMenu(false)} 
          user={user}
          onLogout={handleLogout} 
        />
      )}
    </>
  );
};

export default Navigation;