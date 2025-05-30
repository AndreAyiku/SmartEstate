import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import Navigation from '@/components/Navigation';

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

      <Navigation />

      {/* Background Image - replacing video */}
      <div className={styles.imageBg} style={{ backgroundImage: 'url(../bg1.jpeg)' }}></div>

      {/* Dark Overlay */}
      <div className={styles.overlay}></div>

      <main className={styles.main}>
        <div className={styles.welcomeMessage}>
          <h1>Welcome to Smart Real Estate</h1>
          <p>Find, rent, and buy properties effortlessly.</p>
          <div className={styles.ctaButtons}>
            <Link href="/login" className={styles.ctaButton}>
              Get Started
            </Link>
            
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.socialIcons}>
            <a href="#"><i className="bx bxl-twitter"></i></a>
            <a href="https://www.instagram.com/smartestatee?igsh=MTI1enVvdHNtN3c1NA%3D%3D&utm_source=qr"><i className="bx bxl-instagram"></i></a>
            <a href="#"><i className="bx bxl-linkedin"></i></a>
          </div>
        </div>
        <p className={styles.footerText}>
          <span>Need more info?</span> 
          <Link href="/contact">Contact us</Link>
        </p>
      </footer>
    </div>
  );
}