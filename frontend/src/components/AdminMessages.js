import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminMessages.css';

const AdminMessages = ({ admin }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'inbox' ? '/api/admin/messages' : '/api/admin/messages/sent';
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/admin/messages/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMessageClick = async (message) => {
    try {
      const response = await axios.get(`/api/admin/messages/${message.id}`);
      if (response.data.success) {
        setSelectedMessage(response.data.thread);
        setReplySubject(`Re: ${message.subject}`);
      }
    } catch (error) {
      console.error('Error fetching message thread:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    try {
      const response = await axios.post(`/api/admin/messages/${selectedMessage.parent.id}/reply`, {
        message: replyText,
        subject: replySubject
      });

      if (response.data.success) {
        setReplyText('');
        setReplySubject('');
        // Refresh messages
        fetchMessages();
        fetchUnreadCount();
        // Refresh thread
        handleMessageClick(selectedMessage.parent);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getMessageStatus = (status) => {
    switch (status) {
      case 'unread': return <span className="status-badge unread">Unread</span>;
      case 'read': return <span className="status-badge read">Read</span>;
      case 'replied': return <span className="status-badge replied">Replied</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  const renderMessageList = () => {
    if (loading) {
      return <div className="loading">Loading messages...</div>;
    }

    if (messages.length === 0) {
      return <div className="no-messages">No messages found</div>;
    }

    return (
      <div className="message-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-item ${selectedMessage?.parent?.id === message.id ? 'selected' : ''}`}
            onClick={() => handleMessageClick(message)}
          >
            <div className="message-header">
              <div className="message-sender">
                <strong>
                  {message.sender_type === 'student' ? message.sender_name : 'Admin'}
                </strong>
              </div>
              <div className="message-meta">
                {getMessageStatus(message.status)}
                <span className="message-date">{formatDate(message.created_at)}</span>
              </div>
            </div>
            <div className="message-subject">{message.subject}</div>
            <div className="message-preview">
              {message.message.length > 100 
                ? `${message.message.substring(0, 100)}...` 
                : message.message
              }
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMessageDetail = () => {
    if (!selectedMessage) {
      return <div className="no-message-selected">Select a message to view details</div>;
    }

    const { parent, replies } = selectedMessage;

    return (
      <div className="message-detail">
        <div className="message-detail-header">
          <h3>{parent.subject}</h3>
          <button 
            className="close-btn"
            onClick={() => setSelectedMessage(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="message-thread">
          {/* Original message */}
          <div className="message-bubble original">
            <div className="message-info">
              <span className="sender">
                {parent.sender_type === 'student' ? parent.sender_name : 'Admin'}
              </span>
              <span className="date">{formatDate(parent.created_at)}</span>
            </div>
            <div className="message-content">{parent.message}</div>
          </div>

          {/* Replies */}
          {replies.map((reply) => (
            <div 
              key={reply.id} 
              className={`message-bubble ${reply.sender_type === 'admin' ? 'admin' : 'student'}`}
            >
              <div className="message-info">
                <span className="sender">
                  {reply.sender_type === 'student' ? reply.sender_name : 'Admin'}
                </span>
                <span className="date">{formatDate(reply.created_at)}</span>
              </div>
              <div className="message-content">{reply.message}</div>
            </div>
          ))}
        </div>

        {/* Reply section */}
        <div className="reply-section">
          <h4>Reply to Student</h4>
          <div className="reply-form">
            <input
              type="text"
              placeholder="Subject"
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              className="reply-subject"
            />
            <textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="reply-text"
              rows="4"
            />
            <button 
              onClick={handleReply}
              disabled={!replyText.trim()}
              className="reply-btn"
            >
              <i className="fas fa-paper-plane"></i>
              Send Reply
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-messages">
      <div className="messages-header">
        <h2>
          <i className="fas fa-envelope"></i>
          Admin Messages
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </h2>
        <p>Manage and reply to student messages</p>
      </div>

      <div className="messages-container">
        <div className="messages-sidebar">
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbox')}
            >
              <i className="fas fa-inbox"></i>
              Inbox
              {unreadCount > 0 && (
                <span className="unread-indicator">{unreadCount}</span>
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
          {renderMessageList()}
        </div>

        <div className="messages-content">
          {renderMessageDetail()}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
