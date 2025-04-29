import { getConversations, sendMessage } from '../../../lib/messageQueries';

export default async function handler(req, res) {
  // GET - List conversations for a user
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const conversations = await getConversations(userId);
      
      // Format conversations for the frontend
      const formattedConversations = conversations.map(convo => ({
        id: [parseInt(userId), convo.conversation_partner].sort().join('-'),
        otherUser: {
          id: convo.conversation_partner,
          name: convo.username,
          userType: convo.user_type,
          profilePicture: convo.profile_picture_base64 
            ? `data:image/jpeg;base64,${convo.profile_picture_base64}` 
            : null
        },
        lastMessage: {
          text: convo.message_text,
          timestamp: convo.created_at,
          isRead: convo.is_read,
          isSender: convo.is_sender,
        },
        unreadCount: parseInt(convo.unread_count),
        propertyId: convo.property_id
      }));
      
      return res.status(200).json(formattedConversations);
    } catch (error) {
      console.error('Error in GET /api/messages:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  } 
  // POST - Send a new message
  else if (req.method === 'POST') {
    try {
      const { senderId, receiverId, messageText, propertyId } = req.body;
      
      if (!senderId || !receiverId || !messageText) {
        return res.status(400).json({ error: 'Sender ID, receiver ID, and message text are required' });
      }
      
      const message = await sendMessage(
        parseInt(senderId), 
        parseInt(receiverId), 
        messageText, 
        propertyId ? parseInt(propertyId) : null
      );
      
      return res.status(201).json(message);
    } catch (error) {
      console.error('Error in POST /api/messages:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  } 
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}