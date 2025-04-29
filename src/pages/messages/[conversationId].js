import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import MessageList from '../../components/Messaging/MessageList';
import MessageThread from '../../components/Messaging/MessageThread';
import MessageComposer from '../../components/Messaging/MessageComposer';
import styles from '../../styles/Messages.module.css';

export default function ConversationPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const router = useRouter();
  const { conversationId } = router.query;
  
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
  
  // Fetch messages when conversation ID changes and user is loaded
  useEffect(() => {
    if (conversationId && user) {
      fetchMessages();
      
      // Setup periodic polling
      const intervalId = setInterval(() => {
        fetchMessages(false);
      }, 10000); // Poll every 10 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [conversationId, user]);
  
  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/messages?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };
  
  const fetchMessages = async (setLoadingState = true) => {
    if (!conversationId) return;
    
    try {
      if (setLoadingState) setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages/${conversationId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      
      const data = await response.json();
      
      setMessages(data.messages);
      setOtherUser(data.otherUser);
      setProperty(data.property);
      
      // Mark messages as read
      markMessagesAsRead();
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
    } finally {
      if (setLoadingState) setLoading(false);
    }
  };
  
  const markMessagesAsRead = async () => {
    if (!conversationId || !user) return;
    
    const [userId1, userId2] = conversationId.split('-').map(Number);
    const otherUserId = userId1 === user.id ? userId2 : userId1;
    
    try {
      await fetch('/api/messages/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: user.id,
          senderId: otherUserId
        }),
      });
      
      // Update local conversations to reflect read status
      fetchConversations();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };
  
  const handleSendMessage = async (messageText) => {
    if (!conversationId || !user || !otherUser) return;
    
    setIsSending(true);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: otherUser.id,
          messageText,
          propertyId: property?.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      // Refresh messages and conversations after sending
      await fetchMessages(false);
      await fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  if (!user) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>
          {otherUser 
            ? `Chat with ${otherUser.name} | Smart Real Estate` 
            : 'Messages | Smart Real Estate'}
        </title>
        <meta name="description" content="View and manage your conversations on Smart Real Estate" />
        <link href="https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.messagesContainer}>
          <div className={`${styles.sidebarContainer} ${styles.hiddenOnMobile}`}>
            <div className={styles.sidebarHeader}>
              <h2>Messages</h2>
            </div>
            
            <MessageList 
              conversations={conversations}
              currentConversationId={conversationId}
            />
          </div>
          
          <div className={styles.contentContainer}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading messages...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <i className="bx bx-error-circle"></i>
                <p>{error}</p>
                <button 
                  onClick={() => fetchMessages()} 
                  className={styles.retryButton}
                >
                  <i className="bx bx-refresh"></i> Retry
                </button>
              </div>
            ) : (
              <>
                <div className={styles.threadHeader}>
                  <div className={styles.backButton} onClick={() => router.push('/messages')}>
                    <i className="bx bx-arrow-back"></i>
                  </div>
                  
                  {otherUser && (
                    <div className={styles.threadUserInfo}>
                      <div className={styles.threadUserAvatar}>
                        {otherUser.profilePicture ? (
                          <img 
                            src={otherUser.profilePicture} 
                            alt={otherUser.name} 
                            className={styles.avatarImage}
                          />
                        ) : (
                          <div className={styles.defaultAvatar}>
                            <i className="bx bx-user"></i>
                          </div>
                        )}
                      </div>
                      <div className={styles.threadUserDetails}>
                        <h3>{otherUser.name}</h3>
                        {otherUser.userType === 'Realtor' && (
                          <span className={styles.userTypeBadge}>Realtor</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <MessageThread 
                  messages={messages}
                  currentUser={user}
                  otherUser={otherUser}
                  property={property}
                />
                
                <MessageComposer 
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}