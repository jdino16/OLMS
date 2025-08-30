import React, { useState } from 'react';
import Chatbot from './Chatbot';
import './ChatbotButton.css';

const ChatbotButton = ({ student }) => {
  const [showChatbot, setShowChatbot] = useState(false);

  const handleOpenChatbot = () => {
    setShowChatbot(true);
  };

  const handleCloseChatbot = () => {
    setShowChatbot(false);
  };

  return (
    <>
      <button 
        className="chatbot-button"
        onClick={handleOpenChatbot}
        title="Ask AI Learning Assistant"
      >
        <div className="chatbot-button-icon">
          <i className="fas fa-robot"></i>
        </div>
        <div className="chatbot-button-pulse"></div>
      </button>

      {showChatbot && (
        <Chatbot 
          student={student} 
          onClose={handleCloseChatbot} 
        />
      )}
    </>
  );
};

export default ChatbotButton;
