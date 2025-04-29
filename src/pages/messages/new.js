import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import MessageComposer from '../../components/Messaging/MessageComposer';
import styles from '../../styles/Messages.module.css';

export default function NewMessagePage() {
  const [user, setUser] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const router = useRouter();
  const { userId: recipientId, propertyId } = router.query;
  
  // Check if user is logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      try {
        const parsedUser = JSON.parse(loggedInUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        router.push('/login?redirect=messages/new');
      }
    } else {
      router.push('/login?redirect=messages/new');
    }
  }, [router]);
  
  // Fetch recipient details when user is loaded and recipient ID is available
  useEffect(() => {
    if (user && recipientId) {
      fetchRecipientDetails();
    }
  }, [user, recipientId]);
  
  // Fetch property details if property ID is provided
  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);
  
  const fetchRecipientDetails = async () => {
    try {
      setLoading(true);
      
      // Check if we're trying to message ourselves
      if (parseInt(recipientId) === user.id) {
        setError("You can't send a message to yourself");
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/users/${recipientId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const data = await response.json();
      setRecipient(data);
    } catch (err) {
      console.error('Error fetching recipient details:', err);
      setError('Failed to load recipient details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPropertyDetails = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      
      const data = await response.json();
      setProperty(data);
    } catch (err) {
      console.error('Error fetching property details:', err);
    }
  };
  
  const handleSendMessage = async (messageText) => {
    if (!user || !recipient) return;
    
    setIsSending(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: recipient.id,
          messageText,
          propertyId: property?.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      // Navigate to the conversation after sending
      const conversationId = [parseInt(user.id), parseInt(recipient.id)].sort().join('-');
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
      setIsSending(false);
    }
  };
  
  if (!user) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>New Message | Smart Real Estate</title>
        <meta name="description" content="Start a new conversation on Smart Real Estate" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.newMessageContainer}>
          <div className={styles.newMessageHeader}>
            <button className={styles.backButton} onClick={() => router.back()}>
              <i className="bx bx-arrow-back"></i>
            </button>
            <h2>New Message</h2>
          </div>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading recipient details...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <i className="bx bx-error-circle"></i>
              <p>{error}</p>
              <button 
                onClick={() => router.back()} 
                className={styles.backToMessagesButton}
              >
                Back to Messages
              </button>
            </div>
          ) : recipient ? (
            <div className={styles.newMessageContent}>
              <div className={styles.recipientCard}>
                <div className={styles.recipientAvatar}>
                  {recipient.profile_picture ? (
                    <img 
                      src={recipient.profile_picture} 
                      alt={recipient.name} 
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      <i className="bx bx-user"></i>
                    </div>
                  )}
                </div>
                <div className={styles.recipientDetails}>
                  <h3>{recipient.name}</h3>
                  {recipient.user_type === 'Realtor' && (
                    <span className={styles.userTypeBadge}>Realtor</span>
                  )}
                </div>
              </div>
              
              {/* Show property details if available */}
              {property && (
                <div className={styles.propertyCard}>
                  <div className={styles.propertyImage}>
                    {property.images && property.images[0] ? (
                      <img src={property.images[0].url} alt={property.title} />
                    ) : (
                      <div className={styles.noPropertyImage}>
                        <i className="bx bx-building-house"></i>
                      </div>
                    )}
                  </div>
                  <div className={styles.propertyInfo}>
                    <h4>{property.title}</h4>
                    <p className={styles.propertyLocation}>{property.location}</p>
                    <p className={styles.propertyPrice}>{property.formattedPrice}</p>
                  </div>
                </div>
              )}
              
              <div className={styles.messagePrompt}>
                <p>Send your first message to {recipient.name}</p>
              </div>
              
              <MessageComposer 
                onSendMessage={handleSendMessage}
                isSending={isSending}
              />
            </div>
          ) : (
            <div className={styles.errorContainer}>
              <i className="bx bx-user-x"></i>
              <p>Recipient not found</p>
              <button 
                onClick={() => router.back()} 
                className={styles.backToMessagesButton}
              >
                Back to Messages
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}