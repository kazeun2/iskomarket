import React from 'react';
import { MapPin, CheckCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface MeetupReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  meetupLocation: string;
  sellerName: string;
  zIndex?: number;
}

export function MeetupReminderModal({ 
  isOpen, 
  onClose, 
  onAgree, 
  meetupLocation,
  sellerName,
  zIndex = 9999
}: MeetupReminderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md transition-all duration-300 animate-in fade-in-0 zoom-in-95 [&>button]:hidden" 
        aria-describedby="meetup-reminder-description"
        style={{ 
          zIndex,
          animation: `scaleIn var(--default-transition-duration) var(--default-transition-timing-function)`,
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <DialogTitle className="text-xl text-center">
              Reminder: Meet-Up at {meetupLocation}
            </DialogTitle>
          </div>
          <DialogDescription id="meetup-reminder-description" className="text-left pt-2">
            This seller's fixed meet-up location is <span className="font-semibold text-primary">{meetupLocation}</span>. 
            Please ensure your transaction will take place at this location for safety.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Location Details Card */}
          <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Designated Meet-Up Location</p>
                <p className="text-lg text-primary">{meetupLocation}</p>
              </div>
            </div>
          </div>

          {/* Safety Reminder */}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Safety First:</strong> All transactions must be face-to-face with cash payment only. Always meet in designated campus locations for your protection. IskoMarket is not responsible for transactions conducted outside these safe zones.
            </p>
          </div>

          {/* Agreement Note */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground italic">
              By continuing, you agree to meet the seller at their chosen CvSU meet-up location.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 transition-all duration-200 hover:bg-muted"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onAgree}
            className="flex-1 transition-all duration-200 hover:scale-[1.02]"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Agree & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}