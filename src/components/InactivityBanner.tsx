import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

interface InactivityBannerProps {
  accountStatus: 'active' | 'on-hold' | 'pending-deletion' | 'archived';
  inactiveDays: number;
  onAppeal: () => void;
}

export function InactivityBanner({ accountStatus, inactiveDays, onAppeal }: InactivityBannerProps) {
  if (accountStatus === 'active') {
    return null;
  }

  const getDaysText = () => {
    if (inactiveDays >= 90) {
      const daysLeft = 100 - inactiveDays;
      return `${daysLeft} days until permanent deletion`;
    }
    return `${inactiveDays} days inactive`;
  };

  const getProgressValue = () => {
    if (inactiveDays >= 30 && inactiveDays < 90) {
      return ((90 - inactiveDays) / 60) * 100; // 30-90 day range
    } else if (inactiveDays >= 90) {
      return ((100 - inactiveDays) / 10) * 100; // 90-100 day range
    }
    return 100;
  };

  return (
    <div className="mb-4 animate-in fade-in-0 slide-in-from-top-2 duration-500">
      {accountStatus === 'on-hold' && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  ⚠️ <strong>Account on hold due to inactivity.</strong> Click Appeal to reactivate.
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Your products are currently hidden and you cannot purchase items.
                </p>
              </div>
              
              {/* Countdown Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{getDaysText()}</span>
                  </div>
                  <span className="text-xs text-yellow-700 dark:text-yellow-300">
                    {Math.round(getProgressValue())}% time remaining
                  </span>
                </div>
                <Progress 
                  value={getProgressValue()} 
                  className="h-2 bg-yellow-200 dark:bg-yellow-900"
                />
              </div>

              <Button
                onClick={onAppeal}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(251,146,60,0.6)]"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Appeal to Reactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {accountStatus === 'pending-deletion' && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-red-900 dark:text-red-100">
                  🚨 <strong>Critical: Account scheduled for deletion</strong>
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  You have {100 - inactiveDays} days to appeal before permanent deletion.
                </p>
              </div>
              
              {/* Countdown Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{getDaysText()}</span>
                  </div>
                  <span className="text-xs text-red-700 dark:text-red-300">
                    {Math.round(getProgressValue())}% time remaining
                  </span>
                </div>
                <Progress 
                  value={getProgressValue()} 
                  className="h-2 bg-red-200 dark:bg-red-900"
                />
              </div>

              <Button
                onClick={onAppeal}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Appeal Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {accountStatus === 'archived' && (
        <div className="bg-[var(--surface-soft)] dark:bg-gray-950/20 border-l-4 border-gray-500 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <strong>Account Archived</strong>
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                Your account is archived. Contact admin to restore access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
