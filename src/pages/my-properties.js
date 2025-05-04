import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/MyProperties.module.css';
import Navigation from '../components/Navigation';
import PropertyManagement from '../components/PropertyManagement';

export default function MyPropertiesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      router.push('/login?redirect=/my-properties');
      return;
    }

    const parsedUser = JSON.parse(loggedInUser);
    setUser(parsedUser);

    // Validate user is a realtor or admin
    if (parsedUser.user_type !== 'Realtor' && parsedUser.user_type !== 'Admin') {
      router.push('/');
      return;
    }

    // Fetch user's properties
    fetchProperties(parsedUser.id);
  }, [router]);

  const fetchProperties = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/properties/realtor/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      // Get the user data for authorization
      const userData = localStorage.getItem('user');
      if (!userData) {
        alert('You need to be logged in to delete properties');
        return;
      }

      const user = JSON.parse(userData);
      const userToken = Buffer.from(JSON.stringify(user)).toString('base64');

      // Send the delete request with authorization
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete property');
      }

      // Remove property from state
      setProperties(properties.filter(property => property.id !== propertyId));
      alert('Property deleted successfully');
    } catch (err) {
      console.error('Error deleting property:', err);
      alert(err.message || 'Failed to delete property. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>My Properties | SmartEstate</title>
          <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>My Properties | SmartEstate</title>
        <meta name="description" content="Manage your property listings" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>

      <Navigation />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Properties</h1>
          <Link href="/AddProperty" className={styles.addPropertyButton}>
            <i className="bx bx-plus"></i> Add New Property
          </Link>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <i className="bx bx-error-circle"></i>
            <p>{error}</p>
            <button onClick={() => fetchProperties(user.id)} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}

        {!error && properties.length === 0 && (
          <div className={styles.emptyState}>
            <i className="bx bx-building-house"></i>
            <h2>No Properties Found</h2>
            <p>You have not listed any properties yet.</p>
            <Link href="/AddProperty" className={styles.addPropertyButton}>
              <i className="bx bx-plus"></i> Add Your First Property
            </Link>
          </div>
        )}

        {properties.length > 0 && (
          <PropertyManagement 
            properties={properties} 
            onDeleteProperty={handleDeleteProperty} 
          />
        )}
      </main>
    </div>
  );
}