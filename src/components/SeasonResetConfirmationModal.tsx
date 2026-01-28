import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';

interface SeasonResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  currentSeason: number;
}

export function SeasonResetConfirmationModal({
  isOpen,
  onClose,
  onProceed,
  currentSeason,
}: SeasonResetConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/40">
              <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-left">Season Reset</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Current Season: Season {currentSeason}
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Confirm season reset action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-4">
            <p className="text-sm mb-4">
              Are you sure you want to reset the season? This action will affect user credit scores, marketplace statistics, and leaderboard rankings.
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Reset credit scores for all users (except admins) based on the Season Reset Table
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Recalculate Top Buyers and Top Sellers
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Clear marketplace activity metrics for the new season
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Lock IsKoins for students below 100 credit score
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Remove Trustworthy badges from users dropping below 90–100 range
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-600 dark:bg-orange-500 mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Prepare new season statistics
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={onProceed}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-foreground shadow-lg shadow-orange-500/30"
            >
              Proceed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
