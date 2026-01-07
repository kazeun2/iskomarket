import React from 'react';
import { X, Megaphone, Calendar, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface SystemAnnouncementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: {
    id: string;
    title: string;
    content: string;
    postedBy: string;
    postedDate: Date;
    category: 'maintenance' | 'feature' | 'policy' | 'event';
    urgent: boolean;
  };
}

export function SystemAnnouncementDetailsModal({
  isOpen,
  onClose,
  announcement
}: SystemAnnouncementDetailsModalProps) {
  if (!isOpen) return null;

  const getCategoryBadge = (category: string) => {
    const styles = {
      maintenance: { bg: '#FFA733', text: 'Maintenance' },
      feature: { bg: '#3BAE5C', text: 'New Feature' },
      policy: { bg: '#3A9DF9', text: 'Policy Update' },
      event: { bg: '#9B59B6', text: 'Event' }
    };
    
    const style = styles[category as keyof typeof styles] || styles.feature;
    
    return (
      <Badge style={{ backgroundColor: style.bg, color: '#FFFFFF' }}>
        {style.text}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div 
      className="fixed inset-0 bg-white dark:backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="modal-header-standard">
          <div className="modal-header-content">
            <div className="modal-header-text">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <h2 className="modal-header-title">System Announcement</h2>
              </div>
              <p className="modal-header-description">
                Official platform update
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="modal-close-button-standard"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <ScrollArea className="max-h-[500px]">
          <div className="p-6 space-y-5">
            {/* Announcement Meta */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryBadge(announcement.category)}
                  {announcement.urgent && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold">{announcement.title}</h3>
              </div>
            </div>

            {/* Posted Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>Posted by {announcement.postedBy}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(announcement.postedDate)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Announcement Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                {announcement.content}
              </div>
            </div>

            {/* Action Banner */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <p className="text-sm text-center text-muted-foreground">
                💡 For questions or concerns, contact the admin team through the feedback form.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Modal Footer */}
        <div className="modal-footer-standard">
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
