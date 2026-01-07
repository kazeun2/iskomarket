import React from 'react';
import App from './App';
import { AnnouncementProvider } from './contexts/AnnouncementContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';

export default function AppWithProviders() {
  return (
    <AnnouncementProvider>
      <AuthProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AuthProvider>
    </AnnouncementProvider>
  );
}
