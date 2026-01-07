import React from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface InactivityManagerProps {
  currentUser: any;
  onUserUpdate: (updatedUser: any) => void;
}

export function InactivityManager({ currentUser, onUserUpdate }: InactivityManagerProps) {
  const [showReminder, setShowReminder] = React.useState(false);
  const [showWarning, setShowWarning] = React.useState(false);
  const [show90DayWarning, setShow90DayWarning] = React.useState(false);
  const [show100DayWarning, setShow100DayWarning] = React.useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = React.useState(false);

  // Calculate inactive days (mock calculation - in real app, calculate from lastActive date)
  const inactiveDays = currentUser?.inactiveDays || 0;
  const daysUntilDeletion = Math.max(0, 100 - inactiveDays);

  React.useEffect(() => {
    // Check inactivity status and show appropriate popup
    if (inactiveDays === 25 && !currentUser?.dismissedDay25Reminder) {
      setShowReminder(true);
    } else if (inactiveDays >= 30 && inactiveDays < 90 && currentUser?.accountStatus === 'on-hold') {
      setShowWarning(true);
    } else if (inactiveDays >= 90 && inactiveDays < 100) {
      setShow90DayWarning(true);
    } else if (inactiveDays >= 100 && inactiveDays < 130) {
      setShow100DayWarning(true);
    }
  }, [inactiveDays, currentUser]);

  const handleImActive = () => {
    // Reset inactivity counter
    const updatedUser = {
      ...currentUser,
      inactiveDays: 0,
      lastActive: new Date().toISOString(),
      dismissedDay25Reminder: true,
      accountStatus: 'active'
    };
    onUserUpdate(updatedUser);
    setShowReminder(false);
    toast.success('Activity confirmed! Your account is active.');
  };

  const handleAppeal = () => {
    // Restore account and products
    const updatedUser = {
      ...currentUser,
      inactiveDays: 0,
      lastActive: new Date().toISOString(),
      accountStatus: 'active',
      productsOnHold: false
    };
    onUserUpdate(updatedUser);
    setShowWarning(false);
    setShow90DayWarning(false);
    setShowSuccessBanner(true);
    
    // Hide success banner after 5 seconds
    setTimeout(() => setShowSuccessBanner(false), 5000);
  };

  return (
    <>
      {/* Day 25 Reminder Popup */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent 
          className="sm:max-w-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <span>Are You Still Active?</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirm your activity to keep your account active
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-foreground">
                Hey! We've noticed you haven't been active for a while. Please click this button if you're active.
              </p>
            </div>

            <Button 
              onClick={handleImActive}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              I'm Active
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day 30 Warning Popup */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent 
          className="sm:max-w-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <span>Account On Hold</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Your account has been placed on hold due to inactivity
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-foreground">
                You've been inactive for 30 days. Your products are currently on hold and you cannot contact a seller to buy. Please click the Appeal button below to restore your products and regain access.
              </p>
            </div>

            <Button 
              onClick={handleAppeal}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(251,146,60,0.6)] animate-glow"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Appeal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day 90 Full-Screen Warning */}
      <Dialog open={show90DayWarning} onOpenChange={setShow90DayWarning}>
        <DialogContent 
          className="sm:max-w-2xl max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-500"
        >
          <div className="absolute inset-0 bg-orange-500/10 -z-10 blur-xl" />
          
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center animate-pulse">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
              <span className="text-orange-600">Critical Warning</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Critical warning about account deletion
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="rounded-xl p-6 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-700">
              <p className="text-lg text-foreground mb-4">
                Your account will be permanently deleted in <span className="text-2xl text-orange-600">{daysUntilDeletion} days</span> if you don't click the appeal button.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Time remaining</span>
                  <span className="text-sm text-orange-600">{daysUntilDeletion} days left</span>
                </div>
                <Progress 
                  value={(daysUntilDeletion / 10) * 100} 
                  className="h-3 bg-orange-200 dark:bg-orange-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card rounded-lg border text-center">
                <div className="text-3xl mb-1">{inactiveDays}</div>
                <div className="text-xs text-muted-foreground">Days Inactive</div>
              </div>
              <div className="p-4 bg-card rounded-lg border text-center">
                <div className="text-3xl mb-1">{daysUntilDeletion}</div>
                <div className="text-xs text-muted-foreground">Days to Act</div>
              </div>
            </div>

            <Button 
              onClick={handleAppeal}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(251,146,60,0.8)] animate-glow"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Reactivate My Account Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day 100 Final Warning */}
      <Dialog open={show100DayWarning} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-2xl max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-500"
        >
          <DialogDescription className="sr-only">
            Your account has been inactive for 100 days and will be permanently deleted.
          </DialogDescription>
          <div className="absolute inset-0 bg-red-500/10 -z-10 blur-xl" />
          
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <span className="text-red-600">Account Deletion Notice</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="rounded-xl p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-700">
              <p className="text-lg text-foreground mb-4">
                Your account has been inactive for <span className="text-2xl text-red-600">100 days</span> and will now be permanently deleted.
              </p>
              
              <p className="text-sm text-muted-foreground">
                Please contact the admin if you believe this is a mistake.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">What happens next?</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Your account will be moved to Archived state for 30 days</li>
                <li>After 130 days total, all data will be permanently deleted</li>
                <li>Contact admin@iskomarket.cvsu.edu.ph for assistance</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  window.location.href = 'mailto:admin@iskomarket.cvsu.edu.ph?subject=Account Recovery Request';
                }}
                variant="outline"
                className="flex-1"
              >
                Contact Admin
              </Button>
              <Button 
                onClick={() => setShow100DayWarning(false)}
                variant="destructive"
                className="flex-1"
              >
                I Understand
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-500 rounded-lg p-4 shadow-xl max-w-md">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-green-800 dark:text-green-200">
                  ✅ Account reactivated successfully! Your products are now visible again.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(251, 146, 60, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(251, 146, 60, 0.8);
          }
        }

        .animate-glow:hover {
          animation: glow 1.5s ease-in-out infinite;
        }
      `}
      </style>
    </>
  );
}