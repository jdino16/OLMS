import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = ({ student, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI learning assistant. I can help you with questions about your courses, notes, assignments, and any learning-related topics. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Use backend proxy endpoint instead of direct API call
  const API_URL = '/api/chatbot';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send request to backend proxy endpoint
      const requestData = {
        message: inputMessage,
        student_name: student?.name || 'Student'
      };

      const response = await axios.post(API_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const botResponse = response.data.response;

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot API Error:', error);
      
      let errorContent = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact your instructor for help.";
      
      // Check if it's a backend error with a specific message
      if (error.response?.data?.error) {
        errorContent = error.response.data.error;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="chatbot-overlay" onClick={handleClose}>
      <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-avatar">
              <i className="fas fa-robot"></i>
            </div>
            <div className="chatbot-info">
              <h3>AI Learning Assistant</h3>
              <span className="status">
                <span className="status-dot"></span>
                Online
              </span>
            </div>
          </div>
          <button className="chatbot-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot-message">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-container">
          <div className="chatbot-input-wrapper">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your learning..."
              className="chatbot-input"
              rows="1"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="chatbot-send-btn"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
          <div className="chatbot-suggestions">
            <span>Quick questions:</span>
            <button onClick={() => setInputMessage("How can I improve my study habits?")}>
              Study tips
            </button>
            <button onClick={() => setInputMessage("What are effective note-taking methods?")}>
              Note-taking
            </button>
            <button onClick={() => setInputMessage("How do I prepare for exams?")}>
              Exam prep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
