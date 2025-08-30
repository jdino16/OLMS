import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Messages.css';

const Messages = ({ student, onBack }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    subject: '',
    message: '',
    message_type: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      if (activeTab === 'inbox') {
        const response = await axios.get('/api/messages/inbox');
        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } else {
        const response = await axios.get('/api/messages/sent');
        if (response.data.success) {
          setSentMessages(response.data.messages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/messages/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleComposeMessage = async () => {
    if (!composeData.subject.trim() || !composeData.message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const messageData = {
        sender_id: student.id,
        sender_type: 'student',
        receiver_id: 1, // Admin ID (assuming admin ID is 1)
        receiver_type: 'admin',
        subject: composeData.subject,
        message: composeData.message,
        message_type: composeData.message_type
      };

      const response = await axios.post('/api/messages/send', messageData);
      if (response.data.success) {
        alert('Message sent successfully!');
        setComposeData({ subject: '', message: '', message_type: 'general' });
        setShowCompose(false);
        fetchMessages();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message) => {
    try {
      const response = await axios.get(`/api/messages/${message.id}`);
      if (response.data.success) {
        setSelectedMessage(response.data.thread);
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching message thread:', error);
    }
  };

  const handleReply = async (parentMessageId, replyText) => {
    if (!replyText.trim()) return;

    try {
      const messageData = {
        sender_id: student.id,
        sender_type: 'student',
        receiver_id: 1, // Admin ID
        receiver_type: 'admin',
        subject: `Re: ${selectedMessage.parent.subject}`,
        message: replyText,
        message_type: 'reply',
        parent_message_id: parentMessageId
      };

      const response = await axios.post('/api/messages/send', messageData);
      if (response.data.success) {
        // Refresh the message thread
        handleViewMessage({ id: parentMessageId });
        fetchMessages();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'issue': return 'fas fa-exclamation-triangle';
      case 'question': return 'fas fa-question-circle';
      case 'reply': return 'fas fa-reply';
      default: return 'fas fa-envelope';
    }
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'issue': return '#dc3545';
      case 'question': return '#ffc107';
      case 'reply': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  return (
    <div className="messages-container">
      <div className="messages-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Back to Dashboard
        </button>
        <h2>Messages</h2>
        <button 
          className="compose-btn"
          onClick={() => setShowCompose(true)}
        >
          <i className="fas fa-plus"></i>
          New Message
        </button>
      </div>

      <div className="messages-content">
        <div className="messages-sidebar">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbox')}
            >
              <i className="fas fa-inbox"></i>
              Inbox
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
              onClick={() => setActiveTab('sent')}
            >
              <i className="fas fa-paper-plane"></i>
              Sent
            </button>
          </div>

          <div className="message-list">
            {loading ? (
              <div className="loading-messages">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading messages...</p>
              </div>
            ) : (
              (activeTab === 'inbox' ? messages : sentMessages).map((message) => (
                <div
                  key={message.id}
                  className={`message-item ${message.status === 'unread' ? 'unread' : ''} ${selectedMessage?.parent?.id === message.id ? 'selected' : ''}`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="message-icon">
                    <i 
                      className={getMessageTypeIcon(message.message_type)}
                      style={{ color: getMessageTypeColor(message.message_type) }}
                    ></i>
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-subject">{message.subject}</span>
                      <span className="message-date">{formatDate(message.created_at)}</span>
                    </div>
                    <div className="message-preview">
                      {message.message.substring(0, 100)}...
                    </div>
                    <div className="message-meta">
                      <span className="message-sender">
                        {activeTab === 'inbox' ? `From: ${message.sender_name}` : `To: ${message.receiver_name}`}
                      </span>
                      {message.status === 'unread' && (
                        <span className="unread-indicator">New</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="message-detail">
          {selectedMessage ? (
            <div className="message-thread">
              <div className="thread-header">
                <h3>{selectedMessage.parent.subject}</h3>
                <div className="thread-meta">
                  <span>From: {selectedMessage.parent.sender_name}</span>
                  <span>Date: {formatDate(selectedMessage.parent.created_at)}</span>
                </div>
              </div>

              <div className="thread-messages">
                <div className="message-bubble received">
                  <div className="message-text">{selectedMessage.parent.message}</div>
                  <div className="message-time">{formatDate(selectedMessage.parent.created_at)}</div>
                </div>

                {selectedMessage.replies.map((reply) => (
                  <div 
                    key={reply.id} 
                    className={`message-bubble ${reply.sender_type === 'student' ? 'sent' : 'received'}`}
                  >
                    <div className="message-text">{reply.message}</div>
                    <div className="message-time">{formatDate(reply.created_at)}</div>
                  </div>
                ))}
              </div>

              <div className="reply-section">
                <textarea
                  placeholder="Type your reply..."
                  className="reply-input"
                  id="replyText"
                />
                <button 
                  className="reply-btn"
                  onClick={() => {
                    const replyText = document.getElementById('replyText').value;
                    if (replyText.trim()) {
                      handleReply(selectedMessage.parent.id, replyText);
                      document.getElementById('replyText').value = '';
                    }
                  }}
                >
                  <i className="fas fa-reply"></i>
                  Reply
                </button>
              </div>
            </div>
          ) : (
            <div className="no-message-selected">
              <i className="fas fa-envelope-open"></i>
              <h3>Select a message to view</h3>
              <p>Choose a message from the list to read and reply</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="compose-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Compose New Message</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCompose(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Message Type:</label>
                <select
                  value={composeData.message_type}
                  onChange={(e) => setComposeData({...composeData, message_type: e.target.value})}
                >
                  <option value="general">General</option>
                  <option value="issue">Issue/Problem</option>
                  <option value="question">Question</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  placeholder="Enter subject..."
                />
              </div>

              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({...composeData, message: e.target.value})}
                  placeholder="Describe your issue, question, or concern..."
                  rows="6"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCompose(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleComposeMessage}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;