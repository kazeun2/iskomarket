import React from 'react';
import App from './App';
import { AnnouncementProvider } from './contexts/AnnouncementContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ConnectionStatusProvider } from './contexts/ConnectionStatusContext';

export default function AppWithProviders() {
  return (
    <AnnouncementProvider>
      <AuthProvider>
        <ConnectionStatusProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </ConnectionStatusProvider>
      </AuthProvider>
    </AnnouncementProvider>
  );
}
