import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Authlogin.module.css';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        body: JSON.stringify({ 
          username: identifier,
          password, 
          rememberMe 
        }),
      });

      // After a successful login response
      if (response.ok) {
        const data = await response.json();
        
        // Log the full response for debugging
        console.log('Login response:', data);
        console.log('User ID from server:', data.user.id);
        
        // Store user data in localStorage - ensure ID is explicitly added
        const userToStore = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          user_type: data.user.user_type
        };
        
        console.log('Storing user in localStorage:', userToStore);
        localStorage.setItem('user', JSON.stringify(userToStore));
        
        // Redirect to home or previous page
        router.push('/');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Login - Smart Real Estate</title>
        <meta name="description" content="Login to your Smart Real Estate account" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>

      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className={styles.overlay}></div>

      <div className={styles.formContainer}>
        <div className={styles.welcomeSection}>
          <h1>Welcome</h1>
          <p className={styles.welcomeText}>Log in to explore properties that match your preferences.</p>
          
          <div className={styles.socialMedia}>
            <a href="#" className={styles.socialIcon}><i className="bx bxl-facebook"></i></a>
            <a href="#" className={styles.socialIcon}><i className="bx bxl-google"></i></a>
            <a href="#" className={styles.socialIcon}><i className="bx bxl-twitter"></i></a>
          </div>
        </div>

        <div className={styles.loginSection}>
          <h2 className={styles.formTitle}>Login</h2>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit} id="loginForm">
            <div className={styles.inputGroup}>
              <label htmlFor="identifier" className={styles.inputLabel}>Username or Email</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={styles.formInput}
                placeholder="Enter your username or email"
                required
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.formInput}
                placeholder="Enter your password"
                required
                minLength="6"
              />
              <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                Forgot Password?
              </Link>
            </div>
            
          
            
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            
            <p className={styles.formFooter}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className={styles.formLink}>
                Sign up
              </Link>
            </p>
          </form>
          
        
        </div>
      </div>
    </div>
  );
}