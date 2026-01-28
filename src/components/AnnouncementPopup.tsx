import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Megaphone, AlertTriangle, Calendar, Users } from 'lucide-react';
import { Badge } from './ui/badge';

interface AnnouncementPopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'announcement' | 'system-alert';
  title: string;
  message: string;
  priority?: 'normal' | 'important' | 'urgent';
  targetAudience?: string;
  expirationDate?: string;
  image?: string;
  postedBy?: string;
  postedDate?: string;
  alertType?: 'maintenance' | 'alert';
}

export function AnnouncementPopup({
  isOpen,
  onClose,
  type,
  title,
  message,
  priority = 'normal',
  targetAudience,
  expirationDate,
  image,
  postedBy,
  postedDate,
  alertType
}: AnnouncementPopupProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge className="bg-red-500 text-foreground border-0">
            🔴 Urgent
          </Badge>
        );
      case 'important':
        return (
          <Badge className="bg-orange-500 text-foreground border-0">
            🟡 Important
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-500 text-foreground border-0">
            🟢 Normal
          </Badge>
        );
    }
  };

  const getAudienceText = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'All Users';
      case 'buyers':
        return 'Buyers';
      case 'sellers':
        return 'Sellers';
      case 'admins':
        return 'Admins Only';
      default:
        return audience;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSystemAlert = type === 'system-alert';
  const Icon = isSystemAlert ? AlertTriangle : Megaphone;
  const iconColor = isSystemAlert 
    ? 'text-orange-600 dark:text-orange-400' 
    : 'text-[#0c8f4a] dark:text-emerald-400';
  const iconBgColor = isSystemAlert 
    ? 'bg-orange-100 dark:bg-orange-900/30' 
    : 'bg-emerald-100 dark:bg-emerald-900/30';
  const iconGlow = isSystemAlert
    ? 'drop-shadow(0 0 12px rgba(255,180,0,0.45))'
    : 'drop-shadow(0 0 6px rgba(12,143,74,0.4))';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="iskomarket-twitter-modal p-0 sm:max-w-[600px] max-h-[85vh]"
        style={{
          boxShadow: '0 4px 16px rgba(10,140,70,0.1)'
        }}
      >
        <div className="absolute inset-0 rounded-[28px] -z-10 dark:block hidden"
          style={{
            background: 'rgba(8, 22, 18, 0.60)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 4px 20px rgba(0,255,180,0.12)'
          }}
        />
        
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-[#0c5e35] dark:text-[#DFFFF4]">
            <div className={`h-12 w-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
              <Icon 
                className={`h-6 w-6 ${iconColor}`}
                style={{ filter: iconGlow }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{isSystemAlert ? 'System Alert' : 'Announcement'}</span>
                {!isSystemAlert && priority && getPriorityBadge(priority)}
                {isSystemAlert && alertType && (
                  <Badge className={alertType === 'maintenance' 
                    ? 'bg-orange-500 text-foreground border-0' 
                    : 'bg-blue-500 text-foreground border-0'
                  }>
                    {alertType === 'maintenance' ? '🔧 Maintenance' : '🔔 Alert'}
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isSystemAlert ? 'System alert notification' : 'Announcement notification'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          {/* Image if available */}
          {image && (
            <div className="rounded-lg overflow-hidden border-2 border-emerald-200 dark:border-emerald-900/30">
              <img
                src={image}
                alt={title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="text-xl text-[#064E33] dark:text-[#DFFFF4] mb-2">
              {title}
            </h3>
          </div>

          {/* Message */}
          <div className="p-4 rounded-lg bg-[var(--card)] dark:bg-[rgba(14,24,20,0.55)] border border-[rgba(0,128,64,0.18)] dark:border-[rgba(0,255,160,0.22)]">
            <p className="text-sm text-[#064E33] dark:text-[#E9FFF4] whitespace-pre-wrap">
              {message}
            </p>
          </div>

          {/* Metadata */}
          {!isSystemAlert && (
            <div className="space-y-2">
              {targetAudience && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Target: {getAudienceText(targetAudience)}</span>
                </div>
              )}
              
              {expirationDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Expires: {formatDate(expirationDate)}</span>
                </div>
              )}

              {postedBy && postedDate && (
                <div className="text-xs text-muted-foreground pt-2 border-t border-[rgba(0,128,64,0.12)] dark:border-[rgba(0,255,160,0.12)]">
                  Posted by {postedBy} on {formatDate(postedDate)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Got It Button */}
        <div className="flex-shrink-0 pt-4">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#0c8f4a] to-[#067232] text-foreground shadow-[0_0_12px_rgba(0,255,150,0.35)] hover:brightness-110 hover:translate-y-[-1px] transition-all"
          >
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
