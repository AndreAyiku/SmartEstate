import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '@/components/Navigation';
import styles from '@/styles/EditProfile.module.css';

export default function EditProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const fileInputRef = useRef(null);
  const router = useRouter();
  
  // Check if user is logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      try {
        const parsedUser = JSON.parse(loggedInUser);
        setUser(parsedUser);
        fetchUserDetails(parsedUser.id);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user'); // Remove invalid user data
        router.push('/login?redirect=/account/edit');
      }
    } else {
      router.push('/login?redirect=/account/edit');
    }
  }, [router]);
  
  // Fetch user details
  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const userData = await response.json();
      
      // Populate form with user data
      setUsername(userData.name);
      setEmail(userData.email);
      setBio(userData.bio || '');
      setPhoneNumber(userData.phone_number || '');
      setPreviewUrl(userData.profile_picture || '');
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load your profile information. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSubmitting(true);
      setError(null);
      setMessage({ type: '', content: '' });
      
      // Create form data for file upload and other fields
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('username', username);
      formData.append('email', email);
      formData.append('bio', bio);
      if (phoneNumber) formData.append('phoneNumber', phoneNumber);
      if (profilePicture) formData.append('profilePicture', profilePicture);
      
      // Add user ID to headers for authorization check
      const headers = {
        'user-id': user.id.toString(),
      };
      
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      // Update local storage with the new user data
      const updatedUserData = {
        ...user,
        username: data.user.username,
        email: data.user.email,
        bio: data.user.bio,
        phone_number: data.user.phone_number
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      
      setMessage({ 
        type: 'success', 
        content: 'Profile updated successfully! Redirecting to your profile...' 
      });
      
      // Wait a moment and then redirect
      setTimeout(() => {
        router.push(`/profile/${user.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Edit Profile | Smart Estate</title>
        <meta name="description" content="Update your profile on Smart Estate" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.pageTitle}>
          <h1>Edit Profile</h1>
          <p>Update your personal information and profile image</p>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading your profile information...</p>
          </div>
        ) : (
          <div className={styles.formCard}>
            {error && (
              <div className={styles.errorAlert}>
                <i className="bx bx-error-circle"></i> {error}
              </div>
            )}
            
            {message.content && (
              <div className={`${styles.alert} ${message.type === 'success' ? styles.successAlert : styles.errorAlert}`}>
                {message.type === 'success' ? (
                  <i className="bx bx-check-circle"></i>
                ) : (
                  <i className="bx bx-error-circle"></i>
                )} 
                {message.content}
              </div>
            )}
            
            <form className={styles.profileForm} onSubmit={handleSubmit}>
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Profile Image</h2>
                <div className={styles.profileImageUpload}>
                  <div className={styles.imagePreviewContainer}>
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Profile Preview" 
                        className={styles.profilePreview} 
                      />
                    ) : (
                      <div className={styles.profilePlaceholder}>
                        <i className="bx bx-user"></i>
                      </div>
                    )}
                  </div>
                  <div className={styles.uploadControls}>
                    <button 
                      type="button" 
                      className={styles.uploadButton}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <i className="bx bx-upload"></i> Change Profile Picture
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className={styles.fileInput}
                    />
                    <p className={styles.uploadHelp}>
                      Recommended: Square image, at least 300x300 pixels
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="username">Username*</label>
                  <input
                    type="text"
                    id="username"
                    className={styles.formInput}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    className={styles.formInput}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    className={styles.formInput}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Your phone number (optional)"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    className={styles.formTextarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows="5"
                  ></textarea>
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => router.push(`/profile/${user.id}`)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <i className="bx bx-loader-alt bx-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-save"></i> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} SmartEstate. All rights reserved.</p>
      </footer>
    </div>
  );
}