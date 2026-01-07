import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Announcement {
  id: string;
  type: 'announcement' | 'system-alert';
  title: string;
  message: string;
  priority?: 'normal' | 'important' | 'urgent';
  targetAudience?: 'all' | 'buyers' | 'sellers' | 'admins';
  expirationDate?: string;
  image?: string;
  postedBy?: string;
  postedDate: string;
  alertType?: 'maintenance' | 'alert';
  dismissed?: boolean;
}

interface AnnouncementContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'postedDate' | 'dismissed'>) => void;
  addSystemAlert: (alert: { message: string; alertType: 'maintenance' | 'alert' }) => void;
  dismissAnnouncement: (id: string) => void;
  getActiveAnnouncements: (userType?: 'admin' | 'buyer' | 'seller') => Announcement[];
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      const dismissedIds = JSON.parse(dismissed);
      setAnnouncements(prev => 
        prev.map(ann => ({
          ...ann,
          dismissed: dismissedIds.includes(ann.id)
        }))
      );
    }
  }, []);

  const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'postedDate' | 'dismissed'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: Date.now().toString(),
      postedDate: new Date().toISOString(),
      dismissed: false
    };

    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const addSystemAlert = (alert: { message: string; alertType: 'maintenance' | 'alert' }) => {
    const newAlert: Announcement = {
      id: Date.now().toString(),
      type: 'system-alert',
      title: alert.alertType === 'maintenance' ? 'Scheduled Maintenance' : 'System Alert',
      message: alert.message,
      postedDate: new Date().toISOString(),
      alertType: alert.alertType,
      dismissed: false,
      targetAudience: 'all'
    };

    setAnnouncements(prev => [newAlert, ...prev]);
  };

  const dismissAnnouncement = (id: string) => {
    setAnnouncements(prev =>
      prev.map(ann =>
        ann.id === id ? { ...ann, dismissed: true } : ann
      )
    );

    // Save to localStorage
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    const dismissedIds = dismissed ? JSON.parse(dismissed) : [];
    if (!dismissedIds.includes(id)) {
      dismissedIds.push(id);
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedIds));
    }
  };

  const getActiveAnnouncements = (userType?: 'admin' | 'buyer' | 'seller') => {
    const now = new Date();
    
    return announcements.filter(ann => {
      // Skip dismissed announcements
      if (ann.dismissed) return false;

      // Check expiration
      if (ann.expirationDate && new Date(ann.expirationDate) < now) {
        return false;
      }

      // Check target audience
      if (ann.targetAudience && ann.targetAudience !== 'all') {
        if (userType === 'admin') {
          return ann.targetAudience === 'admins';
        } else if (userType) {
          return ann.targetAudience === userType + 's'; // 'buyers' or 'sellers'
        }
        return false;
      }

      return true;
    });
  };

  return (
    <AnnouncementContext.Provider
      value={{
        announcements,
        addAnnouncement,
        addSystemAlert,
        dismissAnnouncement,
        getActiveAnnouncements
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within AnnouncementProvider');
  }
  return context;
}
