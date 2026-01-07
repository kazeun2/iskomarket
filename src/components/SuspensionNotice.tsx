import React from 'react';
import { Ban, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface SuspensionNoticeProps {
  type: '3-day' | 'permanent';
  reason?: string;
  onAppeal?: () => void;
}

export function SuspensionNotice({ type, reason, onAppeal }: SuspensionNoticeProps) {
  const is3Day = type === '3-day';

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {is3Day ? (
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          ) : (
            <Ban className="h-8 w-8 text-destructive" />
          )}
          <div>
            <CardTitle className="text-destructive">
              {is3Day ? 'Account Suspended - 3 Days' : 'Account Permanently Banned'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {is3Day 
                ? 'Your credit score has dropped to 60 points'
                : 'Your credit score has dropped to 60 points for the second time'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm">
            {is3Day ? (
              <>
                Your account has been temporarily suspended for 3 days due to multiple violations. 
                During this period, you will not be able to:
              </>
            ) : (
              <>
                Your account has been permanently banned from IskoMarket due to repeated violations. 
                This is your second time dropping to 60 credit points.
              </>
            )}
          </p>
          {is3Day && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Post new products</li>
              <li>• Send messages to buyers/sellers</li>
              <li>• Make purchases</li>
            </ul>
          )}
          {reason && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}
        </div>

        {is3Day && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Suspension ends in: 3 days</span>
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-600 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
            {is3Day 
              ? '⚠️ Warning: If your credit score drops to 60 again, your account will be permanently banned.'
              : '❌ This ban is permanent and cannot be reversed.'}
          </p>
        </div>

        {onAppeal && is3Day && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onAppeal}>
              Submit Appeal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
