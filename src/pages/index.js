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
        <title>Smart Real Estate</title>
        <meta name="description" content="Smart Real Estate Management System" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navbarLeft}>
          <Link href="/" className={styles.logo}>
            <i className="bx bxs-building-house"></i> SmartEstate
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

      {/* Background Video */}
      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/background3.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div className={styles.overlay}></div>

      <main className={styles.main}>
        <div className={styles.welcomeMessage}>
          <h1>Welcome to Smart Real Estate</h1>
          <p>Find, rent, and buy properties effortlessly.</p>
          <div className={styles.ctaButtons}>
            <Link href="/properties" className={styles.ctaButton}>
              Get Started
            </Link>
            <Link href="/ai-chatbot" className={styles.ctaSecondary}>
              Get Personalized Recommendations
            </Link>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.socialIcons}>
            <a href="#"><i className="bx bxl-facebook"></i></a>
            <a href="#"><i className="bx bxl-twitter"></i></a>
            <a href="#"><i className="bx bxl-instagram"></i></a>
            <a href="#"><i className="bx bxl-linkedin"></i></a>
          </div>
        </div>
        <p className={styles.footerText}>
          <span>Need more info?</span> 
          <a href="contact.html">Contact us</a> or explore <a href="services.html">Our Services</a>.
        </p>
      </footer>
    </div>
  );
}