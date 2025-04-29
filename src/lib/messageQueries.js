import pool from './db';

// Get all conversations for a user
export async function getConversations(userId) {
  try {
    const query = `
      WITH latest_messages AS (
        SELECT DISTINCT ON (conversation_partner)
          m.id,
          m.message_text,
          m.created_at,
          m.is_read,
          m.property_id,
          CASE 
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END as conversation_partner,
          CASE 
            WHEN m.sender_id = $1 THEN true
            ELSE false
          END as is_sender
        FROM message m
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY conversation_partner, m.created_at DESC
      )
      SELECT 
        lm.*,
        u.username,
        u.user_type,
        encode(u.profile_picture, 'base64') as profile_picture_base64,
        (
          SELECT COUNT(*) 
          FROM message 
          WHERE receiver_id = $1 
          AND sender_id = lm.conversation_partner 
          AND is_read = false
        ) as unread_count
      FROM latest_messages lm
      JOIN "user" u ON u.id = lm.conversation_partner
      ORDER BY lm.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Get messages between two users
export async function getMessages(userId1, userId2) {
  try {
    const query = `
      SELECT 
        m.*,
        CASE 
          WHEN m.sender_id = $1 THEN true
          ELSE false
        END as is_sender,
        u_sender.username as sender_name,
        u_receiver.username as receiver_name
      FROM message m
      JOIN "user" u_sender ON m.sender_id = u_sender.id
      JOIN "user" u_receiver ON m.receiver_id = u_receiver.id
      WHERE 
        (m.sender_id = $1 AND m.receiver_id = $2) OR 
        (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `;
    
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

// Send a new message
export async function sendMessage(senderId, receiverId, messageText, propertyId = null) {
  try {
    const query = `
      INSERT INTO message (sender_id, receiver_id, property_id, message_text, is_read)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
    `;
    
    const result = await pool.query(query, [senderId, receiverId, propertyId, messageText]);
    return result.rows[0];
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Mark messages as read
export async function markMessagesAsRead(receiverId, senderId) {
  try {
    const query = `
      UPDATE message
      SET is_read = true
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
      RETURNING *
    `;
    
    const result = await pool.query(query, [receiverId, senderId]);
    return result.rows;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

// Get user details
export async function getUserDetails(userId) {
  try {
    const query = `
      SELECT 
        id, 
        username, 
        email, 
        user_type, 
        encode(profile_picture, 'base64') as profile_picture_base64,
        bio,
        phone_number
      FROM "user"
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

// Get property details for a conversation
export async function getPropertyDetails(propertyId) {
  try {
    const query = `
      SELECT 
        p.id, 
        p.title,
        p.price,
        p.location,
        encode(pi.image_data, 'base64') as image_base64
      FROM property p
      LEFT JOIN (
        SELECT DISTINCT ON (property_id) property_id, image_data
        FROM property_image
        WHERE is_primary = true
      ) pi ON p.id = pi.property_id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [propertyId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching property details:', error);
    throw error;
  }
}