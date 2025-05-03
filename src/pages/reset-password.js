import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/ForgotPassword.module.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Get token from URL query params
    const { token } = router.query;
    
    if (token) {
      setToken(token);
      validateToken(token);
    }
  }, [router.query]);

  const validateToken = async (token) => {
    try {
      setValidatingToken(true);
      const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setTokenValid(true);
      } else {
        setMessage({ 
          type: 'error', 
          content: data.message || 'Invalid or expired token. Please request a new password reset link.'
        });
        setTokenValid(false);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: 'Failed to validate token. Please try again.'
      });
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match' });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setMessage({ type: 'error', content: 'Password must be at least 6 characters long' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          content: 'Password reset successful! You will be redirected to the login page.'
        });
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Reset Password - Smart Real Estate</title>
          <meta name="description" content="Reset your SmartEstate password" />
          <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        </Head>

        <video className={styles.videoBg} autoPlay loop muted playsInline>
          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className={styles.overlay}></div>

        <div className={styles.formContainer}>
          <div className={styles.formCard}>
            <div className={styles.loadingState}>
              <i className='bx bx-loader-alt bx-spin'></i>
              <p>Validating your reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Reset Password - Smart Real Estate</title>
        <meta name="description" content="Reset your SmartEstate password" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>

      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className={styles.overlay}></div>

      <div className={styles.formContainer}>
        <div className={styles.cardHeader}>
          <Link href="/login" className={styles.backLink}>
            <i className='bx bx-arrow-back'></i>
          </Link>
          <h1>Reset Password</h1>
        </div>

        <div className={styles.formCard}>
          {message.content && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              <i className={`bx ${message.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`}></i>
              <p>{message.content}</p>
            </div>
          )}

          {!tokenValid && !message.content && (
            <div className={`${styles.message} ${styles.error}`}>
              <i className='bx bx-error-circle'></i>
              <p>Invalid or expired reset link. Please request a new one.</p>
              <Link href="/forgot-password" className={styles.requestNewLink}>
                Request New Reset Link
              </Link>
            </div>
          )}

          {tokenValid && (
            <>
              <p className={styles.instructions}>
                Enter your new password below:
              </p>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="password">New Password</label>
                  <div className={styles.inputWithIcon}>
                    <i className='bx bx-lock-alt'></i>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      minLength="6"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className={styles.inputWithIcon}>
                    <i className='bx bx-lock-alt'></i>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      minLength="6"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className='bx bx-loader-alt bx-spin'></i>
                      Updating...
                    </>
                  ) : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <div className={styles.formFooter}>
            <p>Remember your password? <Link href="/login">Log in</Link></p>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>&copy; {new Date().getFullYear()} SmartEstate. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}