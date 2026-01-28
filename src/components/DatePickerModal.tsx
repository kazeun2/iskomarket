import React, { useState } from 'react';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { toast } from 'sonner';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Passes selected date (date-only)
  onDateSelected: (date: Date) => void;
}

export function DatePickerModal({ isOpen, onClose, onDateSelected }: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Minimum date: December 1, 2025
  const minDate = new Date(2025, 11, 1); // Month is 0-indexed, so 11 = December

  const handleConfirm = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    onDateSelected(selectedDate);
    onClose();
    toast.success('Meet-up date proposed!', {
      description: `You've proposed ${selectedDate.toLocaleDateString()}`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard sm:max-w-md bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]">
        <DialogHeader className="modal-header-standard bg-gradient-to-r from-green-600 to-green-700 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]">
          <DialogTitle>Choose Meet-Up Date</DialogTitle>
          <DialogDescription className="sr-only">Select a meet-up date to propose</DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="modal-close-button-standard"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < minDate}
            className="rounded-md border"
          />
        </div>

        {selectedDate && (
          <div className="bg-accent/10 rounded-lg p-3 mb-2">
            <p className="text-sm text-center">
              <strong>Selected Date:</strong><br />
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="flex-1 bg-emerald-600 text-emerald-50 hover:bg-emerald-700 disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted dark:bg-emerald-600 dark:text-emerald-50"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Date
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
