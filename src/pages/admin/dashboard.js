import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '@/components/Navigation';
import UserStats from '@/components/Admin/UserStats';
import UserManagement from '@/components/Admin/UserManagement';
import PropertyManagement from '@/components/Admin/PropertyManagement';
import styles from '@/styles/AdminDashboard.module.css';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  
  // Check if user is logged in and is an admin
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser) {
          const parsedUser = JSON.parse(loggedInUser);
          console.log('User from localStorage:', parsedUser);
          
          if (!parsedUser || !parsedUser.id) {
            console.error('User object is missing ID');
            throw new Error('Invalid user data');
          }
          
          // Check if user is admin (you can do this client-side first)
          if (parsedUser.user_type !== 'Admin') {
            console.error('User is not an admin');
            router.push('/');
            return;
          }
          
          setUser(parsedUser);
        } else {
          router.push('/login?redirect=/admin/dashboard');
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('user'); // Clear invalid data
        router.push('/login?redirect=/admin/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Fetch stats when user is loaded and "stats" tab is active
  useEffect(() => {
    if (user && user.user_type === 'Admin' && activeTab === 'stats') {
      fetchStats();
    }
  }, [user, activeTab]);
  
  const fetchStats = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/stats', {
        headers: {
          'user-id': user.id
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics. Please try again.');
    }
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Dashboard | SmartEstate</title>
        <meta name="description" content="SmartEstate admin dashboard for managing users and properties" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading dashboard...</p>
          </div>
        ) : !user ? (
          <div className={styles.errorContainer}>
            <p>Authentication required. Redirecting to login...</p>
          </div>
        ) : (
          <>
            <div className={styles.dashboardHeader}>
              <h1><i className="bx bxs-dashboard"></i> Admin Dashboard</h1>
            </div>
            
            <div className={styles.tabNavigation}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'stats' ? styles.active : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                <i className="bx bx-stats"></i> Statistics
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <i className="bx bx-user"></i> Users
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'properties' ? styles.active : ''}`}
                onClick={() => setActiveTab('properties')}
              >
                <i className="bx bx-building-house"></i> Properties
              </button>
            </div>
            
            <div className={styles.tabContent}>
              {/* Statistics Tab */}
              {activeTab === 'stats' && (
                error ? (
                  <div className={styles.errorContainer}>
                    <i className="bx bx-error-circle"></i>
                    <p>{error}</p>
                    <button onClick={fetchStats} className={styles.retryButton}>
                      <i className="bx bx-refresh"></i> Retry
                    </button>
                  </div>
                ) : stats ? (
                  <UserStats stats={stats} />
                ) : (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading statistics...</p>
                  </div>
                )
              )}
              
              {/* Users Tab */}
              {activeTab === 'users' && (
                <UserManagement user={user} />
              )}
              
              {/* Properties Tab */}
              {activeTab === 'properties' && (
                <PropertyManagement user={user} />
              )}
            </div>
          </>
        )}
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} SmartEstate. All rights reserved.</p>
      </footer>
    </div>
  );
}