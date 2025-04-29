import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '../../styles/Messages.module.css';

const MessageThread = ({ messages, currentUser, otherUser, property }) => {
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom of messages on load or when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Group messages by date
  const messagesByDate = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  if (!messages || messages.length === 0) {
    return (
      <div className={styles.emptyThread}>
        <div className={styles.emptyThreadIcon}>
          <i className="bx bx-message-rounded-detail"></i>
        </div>
        <h3>No messages yet</h3>
        <p>Start the conversation by sending a message below</p>
      </div>
    );
  }
  
  return (
    <div className={styles.messagesThread}>
      {/* Property details if present */}
      {property && (
        <div className={styles.propertyCard}>
          <div className={styles.propertyImage}>
            {property.image ? (
              <img src={property.image} alt={property.title} />
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
            <Link href={`/properties/${property.id}`} className={styles.viewPropertyLink}>
              View Property
            </Link>
          </div>
        </div>
      )}
      
      {/* Messages grouped by date */}
      {Object.keys(messagesByDate).map((date) => (
        <div key={date} className={styles.messageGroup}>
          <div className={styles.dateHeader}>
            <span>{formatMessageDate(date)}</span>
          </div>
          
          {messagesByDate[date].map((message) => (
            <div 
              key={message.id}
              className={`${styles.messageItem} ${message.sender_id === currentUser.id ? styles.outgoing : styles.incoming}`}
            >
              <div className={styles.messageContent}>
                <p>{message.message_text}</p>
                <span className={styles.messageTime}>{formatMessageTime(message.created_at)}</span>
              </div>
              {message.sender_id !== currentUser.id && (
                <div className={styles.messageSenderAvatar}>
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
              )}
            </div>
          ))}
        </div>
      ))}
      
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread;