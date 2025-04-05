import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Authlogin.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Login | Smart Real Estate Management System</title>
        <meta name="description" content="Login to your Smart Real Estate account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.backgroundImageContainer}>
        {/* Background image will be set via CSS */}
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formWrapper}>
          <h1 className={styles.formTitle}>Login</h1>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.formInput}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className={styles.formFooter}>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className={styles.formLink}>
                Register
              </Link>
            </p>
            <Link href="/" className={styles.formLink}>
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}