import React from 'react';
import { Send, X, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UsernameWithGlow } from './UsernameWithGlow';

interface WarningConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: {
    username: string;
    inactiveDays: number;
    glowEffect?: { name: string; active: boolean; expiresAt?: string } | null;
  } | null;
}

export function WarningConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  user
}: WarningConfirmationModalProps) {
  if (!user) return null;

  const getWarningMessage = () => {
    return `Hi ${user.username}, your account has been inactive for over 30 days. Please click the Keep My Account button below to keep your products active.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard sm:max-w-lg [&>button]:hidden">
        <DialogHeader className="sticky top-0 bg-background z-50 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Ready to Send Warning
          </DialogTitle>
          <DialogDescription className="sr-only">
            Confirm sending inactivity warning to user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium"><UsernameWithGlow username={user.username} glowEffect={user.glowEffect} showTimer={false} /></p>
              <p className="text-xs text-muted-foreground">
                {user.username.toLowerCase()}@cvsu.edu.ph
              </p>
            </div>
            <Badge 
              className="text-xs bg-green-600 hover:bg-green-600 text-white"
            >
              {user.inactiveDays} days inactive
            </Badge>
          </div>

          {/* Warning Type */}
          <div className="p-3 rounded-lg border-2 bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">
                Standard Warning - 30+ Days
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              User will be prompted to keep their account active.
            </p>
          </div>

          {/* Message Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">Warning Message:</label>
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-700">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {getWarningMessage()}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              * This message cannot be edited and will be sent as shown above
            </p>
          </div>

          {/* What Happens Next */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium mb-2">What happens next:</p>
            <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <li>• Warning notification will be sent to the user</li>
              <li>• User will see a banner when they log in</li>
              <li>• User can click "Keep My Account" to stay active</li>
              <li>• Admin will be notified if user responds</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}