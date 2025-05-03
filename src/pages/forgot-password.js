import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/ForgotPassword.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          content: "If your email is registered with us, you will receive a password reset link shortly. Please remeber to check Junk if you don't see the email in your inbox."
        });
        setEmail('');
      } else {
        throw new Error(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Forgot Password - Smart Real Estate</title>
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
          <h1>Forgot Password</h1>
        </div>

        <div className={styles.formCard}>
          {message.content && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              <i className={`bx ${message.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`}></i>
              <p>{message.content}</p>
            </div>
          )}

          <p className={styles.instructions}>
            Enter the email address associated with your account, and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWithIcon}>
                <i className='bx bx-envelope'></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
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
                  Sending...
                </>
              ) : 'Send Reset Link'}
            </button>
          </form>

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