import React, { useEffect, useState } from "react";
import {
  X,
  AlertCircle,
  FileText,
  Clock,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface AccountDeletionAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletionReason?: string;
  adminNote?: string;
  daysRemaining?: number;
}

export function AccountDeletionAppealModal({
  isOpen,
  onClose,
  deletionReason = "Violated marketplace rules",
  adminNote = "Posted prohibited items multiple times despite warnings.",
  daysRemaining = 30,
}: AccountDeletionAppealModalProps) {
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const [appealMessage, setAppealMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAppeal = () => {
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      toast.success(
        "Appeal submitted successfully! Admins will review your appeal within 48 hours.",
      );
      setIsSubmitting(false);
      setAppealMessage("");
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[102] transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-[103] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#1a2f1a] dark:via-[#1a2317] dark:to-[#1a1f1a] rounded-[24px] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[440px] md:max-w-[600px] max-h-[90vh] flex flex-col pointer-events-auto border border-gray-200 dark:border-green-900/20 dark:backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-green-900/20 rounded-t-[24px] dark:bg-gradient-to-r dark:from-[#1a2f1a]/80 dark:via-[#1a2317]/80 dark:to-[#1a1f1a]/80 dark:backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-950/50">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg md:text-xl text-[#003300] dark:text-foreground">
                Submit Appeal
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-green-900/20 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="size-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Critical Alert */}
            <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800/40 rounded-[20px] p-4 dark:backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-900 dark:text-red-100 mb-1 font-medium">
                    Account Deletion Notice
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                    Your account has been flagged for deletion.
                    You have{" "}
                    <strong>{daysRemaining} days</strong> to
                    submit an appeal. If no appeal is submitted,
                    your account will be deactivated for the
                    season and permanently deleted at season
                    reset.
                  </p>
                </div>
              </div>
            </div>

            {/* Deletion Reason (Read-Only) */}
            <div>
              <label className="block text-sm mb-2 text-[#003300] dark:text-foreground">
                Reason for Deletion (Read-only)
              </label>
              <div className="p-4 rounded-[16px] bg-muted dark:bg-green-900/20 border border-gray-300 dark:border-green-900/20 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400 mb-1">
                      {deletionReason}
                    </p>
                    {adminNote && (
                      <p className="text-xs text-muted-foreground dark:text-gray-400 italic">
                        Admin note: {adminNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Appeal Message */}
            <div>
              <label className="block text-sm mb-2 text-[#003300] dark:text-foreground">
                Appeal Message (optional)
              </label>
              <Textarea
                placeholder="Explain your situation (optional)… Admins will review this."
                value={appealMessage}
                onChange={(e) =>
                  setAppealMessage(e.target.value)
                }
                rows={5}
                className="resize-none rounded-[16px] border-gray-300 dark:border-green-900/20"
              />
              <p className="text-xs text-muted-foreground dark:text-gray-400 mt-2">
                Providing context may help admins understand
                your situation better.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-[20px] p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-blue-900 dark:text-blue-100 mb-1 font-medium text-sm">
                    What happens after submission?
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li className="flex items-start gap-2">
                      <span>✔</span>
                      <span>
                        All admins will be notified of your
                        appeal
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✔</span>
                      <span>
                        Your appeal will appear in the Admin
                        Dashboard immediately
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✔</span>
                      <span>
                        Admins will review and respond within 48
                        hours
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>✔</span>
                      <span>
                        If approved, your account will be fully
                        restored
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-green-900/20 space-y-3">
            <Button
              onClick={handleSubmitAppeal}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-foreground py-6 rounded-[16px]"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Appeal
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full py-6 rounded-[16px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
