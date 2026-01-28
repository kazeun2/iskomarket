import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../contexts/AnnouncementContext';
import { AnnouncementPopup } from './AnnouncementPopup';

interface AnnouncementPopupManagerProps {
  userType: 'admin' | 'buyer' | 'seller';
}

export function AnnouncementPopupManager({ userType }: AnnouncementPopupManagerProps) {
  const { getActiveAnnouncements, dismissAnnouncement, announcements } = useAnnouncements();
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any | null>(null);
  const [queue, setQueue] = useState<any[]>([]);

  // Check for new announcements
  useEffect(() => {
    const active = getActiveAnnouncements(userType);
    
    if (active.length > 0 && !currentAnnouncement) {
      // Show the first undismissed announcement
      setCurrentAnnouncement(active[0]);
      setQueue(active.slice(1));
    }
  }, [announcements, userType, currentAnnouncement, getActiveAnnouncements]);

  const handleClose = () => {
    if (currentAnnouncement) {
      dismissAnnouncement(currentAnnouncement.id);
      
      // Show next announcement in queue if available
      if (queue.length > 0) {
        setCurrentAnnouncement(queue[0]);
        setQueue(queue.slice(1));
      } else {
        setCurrentAnnouncement(null);
      }
    }
  };

  if (!currentAnnouncement) return null;

  return (
    <AnnouncementPopup
      isOpen={true}
      onClose={handleClose}
      type={currentAnnouncement.type}
      title={currentAnnouncement.title}
      message={currentAnnouncement.message}
      priority={currentAnnouncement.priority}
      targetAudience={currentAnnouncement.targetAudience}
      expirationDate={currentAnnouncement.expirationDate}
      image={currentAnnouncement.image}
      postedBy={currentAnnouncement.postedBy}
      postedDate={currentAnnouncement.postedDate}
      alertType={currentAnnouncement.alertType}
    />
  );
}
