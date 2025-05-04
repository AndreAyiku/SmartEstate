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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState('User');
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: true,
    uppercase: true,
    number: true,
    special: true
  });
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

  // Enhanced password validation
  const validatePassword = (value) => {
    setPassword(value);
    
    // Check password requirements
    const errors = {
      length: value.length < 8,
      uppercase: !/[A-Z]/.test(value),
      number: !/[0-9]/.test(value),
      special: !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
    };
    
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if password meets all requirements
    if (Object.values(passwordErrors).some(error => error)) {
      setError('Password does not meet all requirements');
      setLoading(false);
      return;
    }

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
      formData.append('phoneNumber', phoneNumber);
      
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
  
  // Check if password is valid overall
  const isPasswordValid = !Object.values(passwordErrors).some(error => error);

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign Up - Smart Real Estate</title>
        <meta name="description" content="Create a Smart Real Estate account" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>

      {/* Background Image - replacing video */}
      <div className={styles.imageBg} style={{ backgroundImage: 'url(/bg3.jpeg)' }}></div>

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
              className={`${styles.inputField} ${password && !isPasswordValid ? styles.invalidInput : ''}`}
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => validatePassword(e.target.value)}
              required
              minLength="8"
            />
            
            {/* Password requirements indicator */}
            {password && (
              <div className={styles.passwordRequirements}>
                <p className={styles.requirementsTitle}>Password must contain:</p>
                <ul>
                  <li className={passwordErrors.length ? styles.invalid : styles.valid}>
                    <i className={`bx ${passwordErrors.length ? 'bx-x' : 'bx-check'}`}></i>
                    At least 8 characters
                  </li>
                  <li className={passwordErrors.uppercase ? styles.invalid : styles.valid}>
                    <i className={`bx ${passwordErrors.uppercase ? 'bx-x' : 'bx-check'}`}></i>
                    At least one uppercase letter
                  </li>
                  <li className={passwordErrors.number ? styles.invalid : styles.valid}>
                    <i className={`bx ${passwordErrors.number ? 'bx-x' : 'bx-check'}`}></i>
                    At least one number
                  </li>
                  <li className={passwordErrors.special ? styles.invalid : styles.valid}>
                    <i className={`bx ${passwordErrors.special ? 'bx-x' : 'bx-check'}`}></i>
                    At least one special character
                  </li>
                </ul>
              </div>
            )}
            
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              className={`${styles.inputField} ${confirmPassword && password !== confirmPassword ? styles.invalidInput : ''}`}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="8"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className={styles.mismatchError}>Passwords do not match</p>
            )}
            
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
              disabled={loading || !isPasswordValid || password !== confirmPassword}
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