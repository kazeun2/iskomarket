import React, { useState } from 'react';
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
import { Button } from './ui/button';

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  onConfirm: (opts?: { permanently?: boolean }) => Promise<void> | void;
  showPermanentlyCheckbox?: boolean; // for admin workflows that want an extra "permanently delete" option
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  productName,
  onConfirm,
  showPermanentlyCheckbox = false,
}: ConfirmDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permanently, setPermanently] = useState(false);

  const handleConfirmClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onConfirm({ permanently });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not delete product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="modal-standard max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Delete product
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left pt-2">
            Are you sure you want to delete {productName ? <strong>“{productName}”</strong> : 'this product'}?
            <span className="block mt-2">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showPermanentlyCheckbox && (
          <div className="px-4 mt-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={permanently} onChange={(e) => setPermanently(e.target.checked)} />
              <span className="text-sm">Also permanently delete linked canonical product and associated data</span>
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-3 px-4">{error}</p>}

        <AlertDialogFooter className="gap-2 pt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isLoading} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button className="bg-destructive text-white" disabled={isLoading} onClick={handleConfirmClick}>
              {isLoading ? 'Deleting…' : 'Delete'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
