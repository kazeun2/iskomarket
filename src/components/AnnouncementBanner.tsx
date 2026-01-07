import React, { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { Button } from './ui/button';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  expirationDate?: string;
  createdAt: string;
  createdBy: string;
  dismissedBy?: string[];
}

interface AnnouncementBannerProps {
  key?: any;
  announcement: Announcement;
  onDismiss: (id: string) => void;
  isDarkMode?: boolean;
}

export function AnnouncementBanner({
  announcement,
  onDismiss,
  isDarkMode = false,
}: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Check if announcement is expired
  useEffect(() => {
    if (announcement.expirationDate) {
      const checkExpiration = () => {
        const now = new Date();
        const expiration = new Date(announcement.expirationDate!);
        
        if (now >= expiration) {
          // Auto-dismiss if expired
          onDismiss(announcement.id);
          return;
        }

        // Calculate time remaining
        const diff = expiration.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeRemaining(`Expires in ${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeRemaining(`Expires in ${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`Expires in ${minutes}m`);
        }
      };

      checkExpiration();
      const interval = setInterval(checkExpiration, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [announcement.expirationDate, announcement.id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(announcement.id);
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="rounded-lg border-2 p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
      style={{
        backgroundColor: isDarkMode ? 'rgba(0, 100, 0, 0.1)' : 'rgba(0, 100, 0, 0.05)',
        borderColor: '#006400',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl mt-0.5">
          📢
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-base text-foreground mb-1" style={{ fontWeight: 600 }}>
                {announcement.title}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {announcement.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-200 p-1 rounded-md hover:bg-secondary"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span>Posted by Admin</span>
            {timeRemaining && (
              <>
                <span>•</span>
                <span>{timeRemaining}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnnouncementBannerListProps {
  announcements: Announcement[];
  onDismiss: (id: string) => void;
  isDarkMode?: boolean;
}

export function AnnouncementBannerList({
  announcements,
  onDismiss,
  isDarkMode = false,
}: AnnouncementBannerListProps) {
  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <AnnouncementBanner
          key={announcement.id}
          announcement={announcement}
          onDismiss={onDismiss}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  );
}
