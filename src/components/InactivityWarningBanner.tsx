import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Mail, Shield } from 'lucide-react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface InactivityWarningBannerProps {
  hasWarning: boolean;
  inactiveDays: number;
  warningMessage?: string;
  onReactivate: () => void;
}

export function InactivityWarningBanner({ 
  hasWarning, 
  inactiveDays, 
  warningMessage,
  onReactivate 
}: InactivityWarningBannerProps) {
  if (!hasWarning) {
    return null;
  }

  const getButtonLabel = () => {
    if (inactiveDays < 60) {
      return 'Keep My Account';
    }
    return 'Reactivate Now';
  };

  const getSeverity = () => {
    if (inactiveDays >= 90) return 'critical';
    if (inactiveDays >= 60) return 'warning';
    return 'info';
  };

  const severity = getSeverity();

  const handleReactivate = () => {
    toast.success('Account Reactivation Request Sent', {
      description: 'Your account has been reactivated. Admin has been notified.',
      duration: 5000
    });
    onReactivate();
  };

  return (
    <div className="mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-500">
      <Card className={`border-l-4 ${
        severity === 'critical' 
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
          : severity === 'warning'
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
          : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
      } shadow-lg`}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              severity === 'critical'
                ? 'bg-red-100 dark:bg-red-900/30 animate-pulse'
                : severity === 'warning'
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'bg-yellow-100 dark:bg-yellow-900/30'
            }`}>
              {severity === 'critical' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Mail className="h-5 w-5 text-orange-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className={`font-semibold ${
                    severity === 'critical'
                      ? 'text-red-900 dark:text-red-100'
                      : severity === 'warning'
                      ? 'text-orange-900 dark:text-orange-100'
                      : 'text-yellow-900 dark:text-yellow-100'
                  }`}>
                    ⚠️ Admin Warning: Account Inactivity Notice
                  </h3>
                </div>
                
                <p className={`text-sm ${
                  severity === 'critical'
                    ? 'text-red-800 dark:text-red-200'
                    : severity === 'warning'
                    ? 'text-orange-800 dark:text-orange-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  You have received an official warning from the IskoMarket administration team.
                </p>
              </div>

              {/* Warning Message */}
              {warningMessage && (
                <div className={`p-4 rounded-lg border ${
                  severity === 'critical'
                    ? 'bg-red-100/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : severity === 'warning'
                    ? 'bg-orange-100/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                    : 'bg-yellow-100/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                }`}>
                  <p className="text-xs font-mono whitespace-pre-line text-gray-900 dark:text-gray-100">
                    {warningMessage}
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className={`flex items-center gap-2 text-xs ${
                    severity === 'critical'
                      ? 'text-red-700 dark:text-red-300'
                      : severity === 'warning'
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-semibold">{inactiveDays} days inactive</span>
                  </div>
                  {inactiveDays >= 30 && (
                    <span className={`text-xs font-medium ${
                      severity === 'critical'
                        ? 'text-red-700 dark:text-red-300'
                        : severity === 'warning'
                        ? 'text-orange-700 dark:text-orange-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {inactiveDays >= 100 
                        ? 'Final Warning' 
                        : `${100 - inactiveDays} days until deletion`}
                    </span>
                  )}
                </div>
                <Progress 
                  value={Math.max(0, ((100 - inactiveDays) / 100) * 100)} 
                  className={`h-2 ${
                    severity === 'critical'
                      ? 'bg-red-200 dark:bg-red-900'
                      : severity === 'warning'
                      ? 'bg-orange-200 dark:bg-orange-900'
                      : 'bg-yellow-200 dark:bg-yellow-900'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleReactivate}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    severity === 'critical'
                      ? 'bg-red-600 hover:bg-red-700 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                      : severity === 'warning'
                      ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-[0_0_15px_rgba(251,146,60,0.6)]'
                      : 'bg-primary hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(0,100,0,0.6)]'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {getButtonLabel()}
                </Button>
                
                <Button
                  onClick={() => {
                    toast.info('To appeal or get help, please contact admin@iskomarket.cvsu.edu.ph');
                  }}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600"
                >
                  Contact Support
                </Button>
              </div>

              {/* Additional Info */}
              <div className={`text-xs ${
                severity === 'critical'
                  ? 'text-red-600 dark:text-red-400'
                  : severity === 'warning'
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                <p className="font-medium">
                  ⓘ Clicking "{getButtonLabel()}" will immediately reactivate your account and notify the admin team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
