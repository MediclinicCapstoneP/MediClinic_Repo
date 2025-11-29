import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { EnhancedChatbotModal } from './EnhancedChatbotModal';
import { useAuth } from '../../contexts/AuthContext';

interface EnhancedFloatingChatButtonProps {
  className?: string;
}

export const EnhancedFloatingChatButton: React.FC<EnhancedFloatingChatButtonProps> = ({ 
  className = '' 
}) => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [hasSavedHistory, setHasSavedHistory] = useState(false);
  const { user } = useAuth();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if user has saved chat history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`chatbot_history_${user.id}`);
      setHasSavedHistory(!!savedHistory);
    }
  }, [user]);

  // Simulate notification count (in real app, this would come from backend)
  useEffect(() => {
    if (!isChatbotOpen && user) {
      const timer = setTimeout(() => {
        setNotificationCount(1);
      }, 30000); // Show notification after 30 seconds
      return () => clearTimeout(timer);
    }
  }, [isChatbotOpen, user]);

  // Hide/show button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY < 2000); // Hide after scrolling down 2000px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChatbotToggle = () => {
    setIsChatbotOpen(!isChatbotOpen);
    if (notificationCount > 0) {
      setNotificationCount(0);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't show on auth pages or very small screens
  const hiddenRoutes = ['/signin', '/signup', '/clinic-signin', '/clinic-signup', '/doctor-signin', '/doctor-signup'];
  const currentPath = window.location.pathname;
  const shouldHide = hiddenRoutes.includes(currentPath) || window.innerWidth < 640;

  if (shouldHide || !isVisible) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isChatbotOpen && (
        <button
          ref={buttonRef}
          onClick={handleChatbotToggle}
          className={`fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group ${className}`}
          aria-label="Open AI Healthcare Assistant"
        >
          <MessageCircle size={24} />
          
          {/* History Indicator */}
          {hasSavedHistory && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
          )}
          
          {/* Notification Badge */}
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
              {notificationCount}
            </span>
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {hasSavedHistory ? 'Continue Chat (History Saved)' : 'AI Healthcare Assistant'}
            <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      )}

      {/* Minimized Chat Window */}
      {isChatbotOpen && isMinimized && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">MediBot Active</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleMinimize}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Expand chat"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsChatbotOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Chatbot Modal */}
      {isChatbotOpen && !isMinimized && (
        <EnhancedChatbotModal
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
        />
      )}

      {/* Minimize Button (when chat is open and not minimized) */}
      {isChatbotOpen && !isMinimized && (
        <button
          onClick={handleMinimize}
          className="fixed bottom-6 right-6 z-30 bg-white text-gray-600 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Minimize chat"
        >
          <Minimize2 size={20} />
        </button>
      )}
    </>
  );
};
