import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from './ui/button';

interface WarningSuccessToastProps {
  username: string;
  onClose: () => void;
}

export function WarningSuccessToast({ username, onClose }: WarningSuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  return (
    <div
      className={`warning-success-toast fixed bottom-6 right-6 z-[9999] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 closing'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <div className="bg-[var(--card)] dark:bg-card rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-green-200 dark:border-green-800 p-4">
        <div className="flex items-start gap-3">
          {/* Green checkmark icon */}
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-2">
            <p className="font-semibold text-foreground mb-1">
              Warning sent to {username}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              User will see the warning banner when they log in.
            </p>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted hover:scale-110 transition-all duration-200 flex-shrink-0 -mt-1 -mr-1"
            onClick={handleClose}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
