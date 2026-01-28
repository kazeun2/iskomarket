import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface SeasonResetProcessingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface ProcessStep {
  id: string;
  label: string;
  completed: boolean;
}

export function SeasonResetProcessingModal({
  isOpen,
  onComplete,
}: SeasonResetProcessingModalProps) {
  const [steps, setSteps] = useState<ProcessStep[]>([
    { id: 'creditScores', label: 'Resetting credit scores/tier', completed: false },
    { id: 'topBuyers', label: 'Calculating Top Buyers', completed: false },
    { id: 'topSellers', label: 'Calculating Top Sellers', completed: false },
    { id: 'fullSeasonStats', label: 'Updating Full Season Stats', completed: false },
    { id: 'seasonSummary', label: 'Updating Season Summary Overview', completed: false },
    { id: 'marketplaceStats', label: 'Updating Marketplace Statistics', completed: false },
    { id: 'seasonResetPopup', label: 'Updating Season Reset Pop-up', completed: false },
    { id: 'trustBadges', label: 'Refreshing Trust Badge eligibility', completed: false },
    { id: 'iskoins', label: 'Locking/unlocking IsKoins', completed: false },
    { id: 'activityLogs', label: 'Resetting activity logs for the new season', completed: false },
  ]);

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setSteps(steps.map(step => ({ ...step, completed: false })));
      setCurrentStep(0);
      return;
    }

    // Simulate processing steps
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setSteps(prev => {
          const updated = [...prev];
          updated[currentStep] = { ...updated[currentStep], completed: true };
          return updated;
        });
        setCurrentStep(prev => prev + 1);
      }, 600); // Each step takes 600ms

      return () => clearTimeout(timer);
    } else if (currentStep === steps.length) {
      // All steps completed, wait a bit then close
      const finalTimer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(finalTimer);
    }
  }, [isOpen, currentStep, steps.length, onComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[85vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-left flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            Resetting Season...
          </DialogTitle>
          <DialogDescription className="text-left">
            Please wait while we process the season reset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4 pb-2 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 rounded-lg p-3 transition-all duration-300 ${
                step.completed
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30'
                  : index === currentStep
                  ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30'
                  : 'bg-[var(--surface-soft)] dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500">
                    <Check className="h-3 w-3 text-foreground" strokeWidth={3} />
                  </div>
                ) : index === currentStep ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                )}
              </div>
              <span
                className={`text-sm ${
                  step.completed
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : index === currentStep
                    ? 'text-blue-900 dark:text-blue-100 font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}

          {currentStep === steps.length && (
            <div className="text-center pt-2 pb-1">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Season reset completed successfully!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
