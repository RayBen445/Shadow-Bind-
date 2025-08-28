import { useState, useEffect, useRef } from 'react';
import { auth, db, isConfigured } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Real-time Chat Component
 * 
 * TODO: Complete implementation
 * - Add message validation and sanitization
 * - Implement message reactions and replies
 * - Add typing indicators
 * - Implement message status (sent, delivered, read)
 * - Add message deletion and editing
 * - Implement message pagination for performance
 * - Add offline support and message queuing
 * - Implement user presence indicators
 */

export default function Chat({ userId, chatId = 'general' }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!isConfigured || !userId) return;

    // TODO: Implement proper collection path structure
    // Suggested Firestore structure:
    // /chats/{chatId}/messages/{messageId}
    // {
    //   text: string,
    //   senderId: string,
    //   senderName: string,
    //   timestamp: timestamp,
    //   type: 'text' | 'image' | 'file',
    //   metadata: object (for file info, etc.)
    //   reactions: { userId: emoji },
    //   replyTo: messageId | null,
    //   edited: boolean,
    //   editedAt: timestamp | null
    // }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
    }, (error) => {
      console.error('Error fetching messages:', error);
      // TODO: Implement proper error handling and user notification
    });

    return () => unsubscribe();
  }, [userId, chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConfigured || !auth.currentUser) return;
    
    setLoading(true);
    
    try {
      // TODO: Add message validation, rate limiting, and spam detection
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || auth.currentUser.email,
        timestamp: serverTimestamp(),
        type: 'text',
        // TODO: Add more fields as needed
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Implement retry mechanism and user feedback
      alert('Failed to send message. Please try again.');
    }
    
    setLoading(false);
  };

  if (!isConfigured) {
    return (
      <div className="chat-container">
        <p>Chat is not available. Please configure Firebase.</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="chat-container">
        <p>Please sign in to use chat.</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>💬 Chat: {chatId}</h3>
        {/* TODO: Add chat info, participants count, online status */}
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.senderId === auth.currentUser?.uid ? 'own-message' : 'other-message'}`}
            >
              <div className="message-header">
                <span className="sender-name">{message.senderName}</span>
                <span className="message-time">
                  {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Sending...'}
                </span>
              </div>
              <div className="message-text">{message.text}</div>
              {/* TODO: Add message reactions, reply button, options menu */}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={loading || !newMessage.trim()}
        >
          {loading ? '⏳' : '📤'}
        </button>
        {/* TODO: Add emoji picker, file upload button, voice message */}
      </form>
    </div>
  );
}