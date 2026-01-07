import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';

interface SeasonResetFinalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentSeason: number;
  newSeasonStartDate: string;
  lastResetDate: string;
}

export function SeasonResetFinalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentSeason,
  newSeasonStartDate,
  lastResetDate,
}: SeasonResetFinalConfirmationModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    if (acknowledged) {
      onConfirm();
      setAcknowledged(false); // Reset for next time
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="modal-standard sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-left">Final Confirmation Required</DialogTitle>
              <p className="text-sm text-red-600 dark:text-red-400">
                Critical Action
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Final confirmation for season reset
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          {/* Warning Message */}
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-4">
            <p className="font-medium text-red-900 dark:text-red-100 mb-2">
              This will permanently reset credit scores and update all season statistics.
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              This action cannot be undone.
            </p>
          </div>

          {/* Summary Information */}
          <div className="space-y-3">
            <h4 className="font-medium">Summary</h4>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-[var(--surface-soft)] dark:bg-[var(--card)]/30 border border-gray-200 dark:border-gray-800 p-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Season</p>
                <p className="font-medium">Season {currentSeason}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">New Season Start Date</p>
                <p className="font-medium">{newSeasonStartDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Reset Date</p>
                <p className="font-medium">{lastResetDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">New Season</p>
                <p className="font-medium">Season {currentSeason + 1}</p>
              </div>
            </div>
          </div>

          {/* Reset Rules Table */}
          <div className="space-y-3">
            <h4 className="font-medium">Reset Rules Applied</h4>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface-soft)] dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Previous Points</th>
                    <th className="px-4 py-3 text-left font-medium">Reset Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  <tr>
                    <td className="px-4 py-3">100–89</td>
                    <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">90</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">90–79</td>
                    <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">79</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">89–70</td>
                    <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">70</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">69 & below</td>
                    <td className="px-4 py-3 font-medium text-amber-600 dark:text-amber-400">Retain current points</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              className="mt-0.5"
            />
            <label
              htmlFor="acknowledge"
              className="text-sm cursor-pointer leading-relaxed"
            >
              I understand the impact of this reset and confirm that I want to proceed with resetting Season {currentSeason} to Season {currentSeason + 1}.
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 pb-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-gray-300 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!acknowledged}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Season Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}