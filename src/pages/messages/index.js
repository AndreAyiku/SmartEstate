import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import MessageList from '../../components/Messaging/MessageList';
import styles from '../../styles/Messages.module.css';

export default function MessagesPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  
  // Check if user is logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      try {
        const parsedUser = JSON.parse(loggedInUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        router.push('/login?redirect=messages');
      }
    } else {
      router.push('/login?redirect=messages');
    }
  }, [router]);
  
  // Fetch conversations when user is loaded
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Setup regular polling for new messages
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(() => {
        fetchConversations();
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [user]);
  
  if (!user) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Messages | Smart Real Estate</title>
        <meta name="description" content="View and manage your conversations on Smart Real Estate" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.messagesContainer}>
          <div className={styles.sidebarContainer}>
            <div className={styles.sidebarHeader}>
              <h2>Messages</h2>
            </div>
            
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading conversations...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <i className="bx bx-error-circle"></i>
                <p>{error}</p>
                <button 
                  onClick={fetchConversations} 
                  className={styles.retryButton}
                >
                  <i className="bx bx-refresh"></i> Retry
                </button>
              </div>
            ) : (
              <MessageList 
                conversations={conversations}
                currentConversationId={null}
              />
            )}
          </div>
          
          <div className={styles.contentContainer}>
            <div className={styles.welcomeMessage}>
              <div className={styles.welcomeIcon}>
                <i className="bx bx-message-square-detail"></i>
              </div>
              <h2>Welcome to Messages</h2>
              <p>Select a conversation from the list to view messages</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}