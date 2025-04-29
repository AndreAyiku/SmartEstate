import { useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Auth.module.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // Added phone number state
  const [userType, setUserType] = useState('User');
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('userType', userType);
      formData.append('phoneNumber', phoneNumber); // Added phone number to form data
      
      if (profileImage) {
        formData.append('profilePicture', profileImage);
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration successful, redirect to login page
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Phone number validation function
  const validatePhoneInput = (value) => {
    // Allow only numbers, spaces, hyphens, brackets, and plus sign
    const regex = /^[0-9\s\-\(\)\+]*$/;
    if (regex.test(value) || value === '') {
      setPhoneNumber(value);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign Up - Smart Real Estate</title>
        <meta name="description" content="Create a Smart Real Estate account" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>

      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/background2.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className={styles.overlay}></div>

      <div className={styles.formContainer}>
        <div className={styles.welcomeSection}>
          <h1>Join SmartEstate Now!</h1>
          <p className={styles.welcomeText}>Sign up to find and manage your dream properties with ease.</p>
        </div>

        <div className={styles.signupSection}>
          <h2>Sign Up</h2>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className={styles.inputField}
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.inputField}
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            {/* Phone number field */}
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              className={styles.inputField}
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => validatePhoneInput(e.target.value)}
              required
            />
            
            <label htmlFor="userType">Account Type</label>
            <select
              id="userType"
              name="userType"
              className={styles.inputField}
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              required
            >
              <option value="User">Regular User</option>
              <option value="Realtor">Realtor</option>
            </select>
            
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.inputField}
              placeholder="Enter 6 characters or more"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              className={styles.inputField}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
            />
            
            <label htmlFor="profile-picture">Profile Picture</label>
            <div className={styles.profileUpload}>
              <input
                type="file"
                id="profile-picture"
                name="profile-picture"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className={styles.fileInput}
              />
              <div className={styles.uploadButton} onClick={() => fileInputRef.current.click()}>
                <i className='bx bx-upload'></i> Choose Image
              </div>
              {previewUrl && (
                <div className={styles.imagePreview}>
                  <img src={previewUrl} alt="Profile preview" />
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className={styles.btn}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            
            <p className={styles.loginText}>
              Already have an account? <Link href="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}