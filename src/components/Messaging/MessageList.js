import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../../styles/Messages.module.css';

const MessageList = ({ conversations, currentConversationId }) => {
  const router = useRouter();
  
  if (!conversations || conversations.length === 0) {
    return (
      <div className={styles.emptyConversations}>
        <div className={styles.emptyIcon}>
          <i className="bx bx-message-square-detail"></i>
        </div>
        <h3>No conversations yet</h3>
        <p>Start a new conversation with a realtor or user</p>
      </div>
    );
  }
  
  const handleConversationClick = (conversationId) => {
    router.push(`/messages/${conversationId}`);
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      // Today - show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.getFullYear() === today.getFullYear()) {
      // This year - show month and day
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      // Different year - show month, day and year
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    }
  };
  
  return (
    <div className={styles.conversationsList}>
      {conversations.map((conversation) => (
        <div 
          key={conversation.id} 
          className={`${styles.conversationItem} ${conversation.id === currentConversationId ? styles.active : ''} ${conversation.unreadCount > 0 && !conversation.lastMessage.isSender ? styles.unread : ''}`}
          onClick={() => handleConversationClick(conversation.id)}
        >
          <div className={styles.conversationAvatar}>
            {conversation.otherUser.profilePicture ? (
              <img 
                src={conversation.otherUser.profilePicture} 
                alt={conversation.otherUser.name} 
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.defaultAvatar}>
                <i className="bx bx-user"></i>
              </div>
            )}
            {conversation.unreadCount > 0 && !conversation.lastMessage.isSender && (
              <span className={styles.unreadBadge}>{conversation.unreadCount}</span>
            )}
          </div>
          <div className={styles.conversationDetails}>
            <div className={styles.conversationHeader}>
              <h4>{conversation.otherUser.name}</h4>
              <span className={styles.timestamp}>{formatTimestamp(conversation.lastMessage.timestamp)}</span>
            </div>
            <p className={styles.messagePreview}>
              {conversation.lastMessage.isSender && <span>You: </span>}
              {conversation.lastMessage.text}
            </p>
            {conversation.otherUser.userType === 'Realtor' && (
              <span className={styles.userType}>Realtor</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;