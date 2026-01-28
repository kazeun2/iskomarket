import React, { useState } from 'react';
import { CheckCircle, X, UserCheck, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

interface Notification {
  id: number;
  type: 'reactivation';
  username: string;
  email: string;
  previousInactiveDays: number;
  timestamp: string;
}

interface AdminNotificationBannerProps {
  notifications: Notification[];
  onDismiss: (id: number) => void;
  onViewUser: (username: string) => void;
}

export function AdminNotificationBanner({ 
  notifications, 
  onDismiss, 
  onViewUser 
}: AdminNotificationBannerProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 shadow-md animate-in fade-in-0 slide-in-from-top-2 duration-500"
        >
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-green-900 dark:text-green-100">
                        ✅ Account Reactivation Confirmed
                      </h4>
                      <Badge className="bg-green-600 text-foreground">New</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8 border-2 border-green-300">
                        <AvatarFallback className="bg-green-600 text-foreground text-xs">
                          {notification.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          {notification.username}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {notification.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-green-700 dark:text-green-300">
                      <p>
                        User clicked the reactivation button after being warned about {notification.previousInactiveDays} days of inactivity.
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                    onClick={() => onDismiss(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => onViewUser(notification.username)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    View User Profile
                  </Button>
                  <Button
                    onClick={() => onDismiss(notification.id)}
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
