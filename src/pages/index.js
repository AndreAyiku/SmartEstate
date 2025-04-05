import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Smart Real Estate Management System</title>
        <meta name="description" content="Smart Real Estate Management System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navbarLeft}>
          <Link href="/" className={styles.logo}>
            SmartEstate
          </Link>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/ai-chatbot" className={styles.navLink}>
            AI Chatbot
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
          {user ? (
            <>
              <span className={styles.welcomeUser}>Welcome, {user.username}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </>
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

      <main className={styles.main}>
        <div className={styles.backgroundImageContainer}>
          {/* Background image will be set via CSS in Home.module.css */}
        </div>

        <div className={styles.welcomeMessage}>
          <h1>Welcome to Smart Real Estate Management System</h1>
          <p>Find your dream property with our AI-powered recommendations and interactive maps</p>
          <div className={styles.ctaButtons}>
            <Link href="/properties" className={styles.ctaButton}>
              Browse Properties
            </Link>
            <Link href="/ai-chatbot" className={styles.ctaSecondary}>
              Get Personalized Recommendations
            </Link>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 Smart Real Estate Management System</p>
      </footer>
    </div>
  );
}