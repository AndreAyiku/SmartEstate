import { markMessagesAsRead } from '../../../lib/messageQueries';

export default async function handler(req, res) {
  // Only handle PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { receiverId, senderId } = req.body;
    
    if (!receiverId || !senderId) {
      return res.status(400).json({ error: 'Receiver ID and sender ID are required' });
    }
    
    const markedMessages = await markMessagesAsRead(
      parseInt(receiverId),
      parseInt(senderId)
    );
    
    return res.status(200).json({ 
      success: true,
      messagesMarked: markedMessages.length
    });
  } catch (error) {
    console.error('Error in PUT /api/messages/read:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}