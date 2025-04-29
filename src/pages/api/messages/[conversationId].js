import { getMessages, getUserDetails, getPropertyDetails } from '../../../lib/messageQueries';

export default async function handler(req, res) {
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { conversationId } = req.query;
    const [userId1, userId2] = conversationId.split('-').map(Number);
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Invalid conversation ID format' });
    }
    
    // Get messages between these users
    const messages = await getMessages(userId1, userId2);
    
    // Get other user details
    const otherUser = await getUserDetails(userId2);
    
    let property = null;
    // Check if any message has a property reference
    const propertyMessage = messages.find(m => m.property_id);
    if (propertyMessage && propertyMessage.property_id) {
      property = await getPropertyDetails(propertyMessage.property_id);
      
      if (property && property.image_base64) {
        property.image = `data:image/jpeg;base64,${property.image_base64}`;
        delete property.image_base64;
      }
      
      // Format price
      if (property && property.price) {
        property.formattedPrice = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(property.price);
      }
    }
    
    // Format user data
    const formattedUser = {
      id: otherUser.id,
      name: otherUser.username,
      email: otherUser.email,
      userType: otherUser.user_type,
      bio: otherUser.bio,
      phoneNumber: otherUser.phone_number,
      profilePicture: otherUser.profile_picture_base64 
        ? `data:image/jpeg;base64,${otherUser.profile_picture_base64}` 
        : null
    };
    
    return res.status(200).json({
      messages,
      otherUser: formattedUser,
      property
    });
  } catch (error) {
    console.error('Error in GET /api/messages/[conversationId]:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
}