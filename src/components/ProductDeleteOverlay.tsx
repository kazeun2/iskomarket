import React, { useState } from 'react';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';
import { Textarea } from './ui/textarea';

export function ProductDeleteOverlay({ product, initialReason = "", onClose, onConfirm } : { product?: any, initialReason?: string, onClose: () => void, onConfirm?: (reason: string) => void }) {
  const [reason, setReason] = useState(initialReason);

  return (
    <div className="w-full max-w-[520px] p-4">
      <div className="bg-[var(--card)] dark:bg-[#04121a] rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <div className="text-lg font-semibold">Confirm Product Deletion</div>
            <div className="text-sm text-muted-foreground">Permanently delete this product listing</div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> This action cannot be undone!
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              Product "{product?.title}" will be permanently deleted and the seller will be notified.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason for Deletion <span className="inline-block px-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">*</span></label>
            <Textarea placeholder="Enter detailed reason for deletion (e.g., violates marketplace policy, prohibited item, counterfeit, etc.)" value={reason} onChange={(e) => setReason((e as any).target.value)} rows={4} className="resize-none" />
            <p className="text-xs text-muted-foreground mt-1">This message will be sent to the seller.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => { if (!reason || !reason.trim()) { return; } if (typeof onConfirm === 'function') onConfirm(reason); }}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
