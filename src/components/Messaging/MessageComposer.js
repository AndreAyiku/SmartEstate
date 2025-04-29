import React, { useState } from 'react';
import styles from '../../styles/Messages.module.css';

const MessageComposer = ({ onSendMessage, isSending }) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() === '') return;
    
    onSendMessage(message);
    setMessage('');
  };
  
  return (
    <form className={styles.messageComposer} onSubmit={handleSubmit}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className={styles.messageInput}
        disabled={isSending}
      />
      <button 
        type="submit" 
        className={styles.sendButton}
        disabled={message.trim() === '' || isSending}
      >
        {isSending ? (
          <i className="bx bx-loader-circle bx-spin"></i>
        ) : (
          <i className="bx bx-send"></i>
        )}
      </button>
    </form>
  );
};

export default MessageComposer;