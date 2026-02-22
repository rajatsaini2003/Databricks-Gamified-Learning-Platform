import React, { createContext, useState, useCallback } from 'react';

export const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const [notification, setNotification] = useState(null); // { message, type: 'success'|'error'|'info' }
  const [modal, setModal] = useState(null); // { type: 'string', props: {} }

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  const openModal = useCallback((type, props = {}) => {
    setModal({ type, props });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    // In a real app, apply class to body/html
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    notification,
    showNotification,
    modal,
    openModal,
    closeModal
  };

  return (
    <UIContext.Provider value={value}>
      {children}
      {/* Global Notification Toast could be rendered here */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 text-white animate-fade-in ${
          notification.type === 'error' ? 'bg-red-600' : 
          notification.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
        }`}>
          {notification.message}
        </div>
      )}
      {/* Global Modal could be rendered here */}
    </UIContext.Provider>
  );
};
