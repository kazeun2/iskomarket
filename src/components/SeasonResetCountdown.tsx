import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';

interface SeasonResetCountdownProps {
  onManualReset?: () => void;
}

export function SeasonResetCountdown({ onManualReset }: SeasonResetCountdownProps) {
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(47);

  // Calculate next reset date (Every May 31 and November 30)
  const getNextResetDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    
    let nextResetDate: Date;
    
    // If we're before May 31, next reset is May 31 of current year
    if (currentMonth < 4 || (currentMonth === 4 && now.getDate() < 31)) {
      nextResetDate = new Date(currentYear, 4, 31); // May 31
    }
    // If we're before November 30, next reset is November 30 of current year
    else if (currentMonth < 10 || (currentMonth === 10 && now.getDate() < 30)) {
      nextResetDate = new Date(currentYear, 10, 30); // November 30
    }
    // Otherwise, next reset is May 31 of next year
    else {
      nextResetDate = new Date(currentYear + 1, 4, 31); // May 31 next year
    }
    
    return nextResetDate;
  };

  const nextResetDate = getNextResetDate();
  const formattedResetDate = nextResetDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Calculate days remaining
  useEffect(() => {
    const calculateDaysRemaining = () => {
      const now = new Date();
      const timeDiff = nextResetDate.getTime() - now.getTime();
      const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      setDaysRemaining(days);
    };

    calculateDaysRemaining();
    // Update every hour
    const interval = setInterval(calculateDaysRemaining, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [nextResetDate]);

  // Determine color based on days remaining
  const getProgressColor = () => {
    if (daysRemaining >= 60) return 'bg-green-500';
    if (daysRemaining >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (daysRemaining >= 60) return 'text-green-600 dark:text-green-400';
    if (daysRemaining >= 30) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleManualReset = () => {
    setShowResetConfirmation(false);
    
    if (onManualReset) {
      onManualReset();
    }
    
    toast.success('Season Reset Complete', {
      description: 'All credit scores and badges have been recalculated. Top 5 data archived.'
    });
  };

  // Calculate progress percentage (180 days per season)
  const totalDays = 180; // ~6 months
  const elapsedDays = totalDays - daysRemaining;
  const progressPercentage = (elapsedDays / totalDays) * 100;

  return (
    <div>
      <div className="bg-gradient-to-r from-[#1a481d] to-[#5dbb3f] rounded-2xl p-5 shadow-lg">
        {/* Main Info */}
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-white" />
          <h3 className="text-white font-medium">
            Next Season Reset: {formattedResetDate}
          </h3>
        </div>
        
        <div className="text-white/80 text-sm mb-3">(Every 6 Months)</div>

        {/* Countdown Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-base ${getTextColor()} bg-white/90 dark:bg-[var(--card)] px-3 py-1.5 rounded-lg font-medium`}>
            🕓 Season Reset in: <strong>{daysRemaining} days</strong>
          </span>
          {daysRemaining < 30 && (
            <AlertTriangle className="h-5 w-5 text-yellow-400 animate-pulse" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="relative h-3 bg-white/20 dark:bg-[var(--card)]/20 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer dark:via-black/20"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-white/80 mt-1">
            <span>Season Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <AlertDialogContent className="modal-standard max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Season Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3 pt-2">
              <p>Are you sure you want to reset all credit scores and badges now?</p>
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <p className="font-medium text-foreground">This will:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Archive current Top 5 buyers and sellers data</li>
                  <li>• Recalculate all credit scores</li>
                  <li>• Re-evaluate trustworthy badges</li>
                  <li>• Apply new season reset rules</li>
                  <li>• Lock/unlock Iskoins based on scores</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This action cannot be undone. Current season data will be permanently archived.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleManualReset}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
            >
              ✅ Confirm Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}