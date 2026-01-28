import React from 'react';
import { Package, CheckCircle2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ExtraProductSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlots: number;
  maxSlots: number;
  onConfirm: () => void;
}

export function ExtraProductSlotModal({
  isOpen,
  onClose,
  currentSlots,
  maxSlots,
  onConfirm
}: ExtraProductSlotModalProps) {
  const handleConfirm = () => {
    onConfirm();
    toast.success('Extra product slot activated for 3 days!', {
      description: 'You can now post one additional product to the marketplace.',
      duration: 4000,
    });
    onClose();
  };

  const newMaxSlots = maxSlots + 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard !w-[500px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add one more product slot</DialogTitle>
          <DialogDescription>
            Increase your product listing capacity by 1 for 3 days
          </DialogDescription>
        </DialogHeader>

        <div className="modal-header-standard">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg">Add one more product slot</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Expand your marketplace presence
              </p>
            </div>
          </div>
        </div>

        <div className="modal-content-standard !max-h-[350px]">
          {/* Info Text */}
          <p className="text-sm text-center text-muted-foreground mb-6">
            You've earned an extra slot for 3 days. You can now post one additional product.
          </p>

          {/* Slot Counter Visualization */}
          <div className="space-y-6">
            {/* Before */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Current Slots:</span>
                <span className="text-destructive line-through">
                  {currentSlots} / {maxSlots}
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: maxSlots }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-12 rounded-lg border-2 ${
                      i < currentSlots
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted border-border'
                    } flex items-center justify-center`}
                  >
                    {i < currentSlots && <Package className="h-5 w-5 text-primary/50" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="text-center text-2xl text-primary">↓</div>

            {/* After */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary">New Capacity:</span>
                <span className="text-primary">
                  {currentSlots} / {newMaxSlots}
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: newMaxSlots }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-12 rounded-lg border-2 ${
                      i < currentSlots
                        ? 'bg-primary/10 border-primary/30'
                        : i === maxSlots
                        ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30 animate-pulse'
                        : 'bg-muted border-border'
                    } flex items-center justify-center transition-all duration-300`}
                  >
                    {i < currentSlots && <Package className="h-5 w-5 text-primary/50" />}
                    {i === maxSlots && (
                      <div className="text-emerald-600 dark:text-emerald-400 text-xs">NEW</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Info */}
          <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-emerald-900 dark:text-emerald-100">
                  <strong>Active Duration:</strong> This extra slot will be available for 3 days. A timer icon will appear beside "Product Slots" showing the remaining time.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer-standard">
          <Button
            onClick={onClose}
            variant="outline"
            className="modal-button-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="modal-button-primary"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Activate Extra Slot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
