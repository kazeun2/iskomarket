import React, { useState, ChangeEvent, useEffect } from 'react';
import { X, AlertTriangle, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface TransactionAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  otherUser: any;
  onSubmitAppeal: (reason: string, evidence: File[]) => void;
}

export function TransactionAppealModal({ 
  isOpen, 
  onClose, 
  product, 
  otherUser,
  onSubmitAppeal 
}: TransactionAppealModalProps) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (evidence.length + files.length > 3) {
      toast.error('Maximum 3 files allowed');
      return;
    }
    setEvidence(prev => ([...prev, ...files] as File[]));
    if (files.length > 0) {
      toast.success(`${files.length} file(s) added`);
    }
  };

  const removeFile = (index: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for your appeal');
      return;
    }

    if (reason.trim().length < 20) {
      toast.error('Please provide at least 20 characters explaining your appeal');
      return;
    }

    onSubmitAppeal(reason, evidence);
    toast.success('Appeal submitted successfully!', {
      description: 'Our team will review your appeal within 24-48 hours.'
    });
    
    // Reset state
    setReason('');
    setEvidence([]);
    onClose();
  };

  const handleCancel = () => {
    setReason('');
    setEvidence([]);
    onClose();
  };

  if (!isOpen) return null;

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div className="bg-background dark:bg-gradient-to-br dark:from-[#1a2f1a] dark:via-[#1a2317] dark:to-[#1a1f1a] rounded-2xl shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-green-900/20 dark:backdrop-blur-xl">
        {/* Modal Header - Standardized */}
        <div className="modal-header-standard dark:bg-gradient-to-r dark:from-[#1a2f1a]/80 dark:via-[#1a2317]/80 dark:to-[#1a1f1a]/80 dark:border-green-900/20 dark:backdrop-blur-sm">
          <div className="modal-header-content">
            <div className="modal-header-text">
              <h2 className="modal-header-title flex items-center gap-2 dark:text-foreground">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Appeal Unsuccessful Transaction
              </h2>
              <p className="modal-header-description dark:text-gray-400">
                Transaction with {otherUser.name} for "{product.title}"
              </p>
            </div>
          </div>
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className="modal-close-button-standard dark:hover:bg-green-900/20"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 dark:backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Transaction marked as unsuccessful</span> because both parties did not confirm completion within 7 days.
                </p>
              </div>
            </div>
          </div>

          {/* Appeal Reason */}
          <div>
            <label className="text-sm mb-3 block dark:text-gray-200">
              Reason for Appeal <span className="inline-block px-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why this transaction should be marked as successful..."
              rows={5}
              className="resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
              {reason.length}/1000 characters (minimum 20)
            </p>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="text-sm mb-3 block dark:text-gray-200">
              Evidence (optional - up to 3 files)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                id="evidence-upload"
              />
              
              {evidence.length > 0 && (
                <div className="space-y-2">
                  {evidence.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted dark:bg-green-900/20 p-3 rounded-lg border border-transparent dark:border-green-900/20">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Upload className="h-4 w-4 text-muted-foreground dark:text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate dark:text-gray-300">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
              Screenshots of messages, proof of payment, or other relevant evidence
            </p>
          </div>

          {/* Info */}
          <div className="bg-primary/10 dark:bg-green-900/30 border border-primary/30 dark:border-green-700/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground dark:text-gray-400 text-center">
              💡 Appeals are reviewed by admins within 24-48 hours. False appeals may affect your credit score.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-standard dark:border-green-900/20">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!reason.trim() || reason.trim().length < 20}
          >
            Submit Appeal
          </Button>
        </div>
      </div>
    </div>
  );
}
