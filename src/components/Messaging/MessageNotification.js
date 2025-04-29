import React from 'react';
import styles from '../../styles/Messages.module.css';

const MessageNotification = ({ count }) => {
  if (!count || count <= 0) return null;
  
  return (
    <span className={styles.notificationBadge}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default MessageNotification;