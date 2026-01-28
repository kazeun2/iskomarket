import React, { useEffect } from "react";
import { X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Notification } from "./NotificationsModal";

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Notification | null;
}

export function ReportDetailsModal({
  isOpen,
  onClose,
  report,
}: ReportDetailsModalProps) {
  if (!isOpen || !report) return null;

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

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
          className="bg-[var(--card)] dark:bg-[var(--card)] rounded-[20px] md:rounded-[24px] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[440px] md:max-w-[600px] max-h-[90vh] flex flex-col pointer-events-auto border border-gray-200 dark:border-[var(--border)] dark:backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - sticky */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border)] dark:bg-[var(--card)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{report.emoji}</span>
              <h2 className="text-[22px] md:text-[24px] dark:text-foreground">Report Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-green-900/20 rounded-full transition-colors"
              aria-label="Close report"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-gray-900 dark:text-foreground mb-2">
              {report.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Report ID: #RP-2024-001234
            </p>

            {/* Status badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-transparent dark:border-green-700/30">
                <CheckCircle className="size-4" />
                <span>Reviewed</span>
              </div>
            </div>

            {/* Report timeline */}
            <div className="space-y-6">
              <div>
                <h4 className="text-gray-900 dark:text-foreground mb-3">
                  Report Timeline
                </h4>
                
                <div className="space-y-4">
                  {/* Timeline item 1 */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="size-4 text-foreground" />
                      </div>
                      <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-900 dark:text-gray-200">
                        Report Reviewed
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Your report has been reviewed and action has been taken.
                      </p>
                      <span className="text-gray-500 dark:text-gray-500 mt-1">
                        3 hours ago
                      </span>
                    </div>
                  </div>

                  {/* Timeline item 2 */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Clock className="size-4 text-foreground" />
                      </div>
                      <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-900 dark:text-gray-200">
                        Under Investigation
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        Our team is investigating your report.
                      </p>
                      <span className="text-gray-500 dark:text-gray-500 mt-1">
                        1 day ago
                      </span>
                    </div>
                  </div>

                  {/* Timeline item 3 */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                        <AlertCircle className="size-4 text-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-gray-900 dark:text-gray-200">
                        Report Submitted
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        You submitted a report about inappropriate content.
                      </p>
                      <span className="text-gray-500 dark:text-gray-500 mt-1">
                        2 days ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional info */}
              <div className="glass-card bg-[var(--card)] dark:bg-[var(--card)] rounded-2xl p-4 border border-transparent dark:border-[var(--border)]">
                <h4 className="text-gray-900 dark:text-foreground mb-2">
                  Resolution
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  The reported content has been removed and the user has been warned. 
                  Thank you for helping keep IskoMarket safe for everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Footer - sticky */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-green-900/20">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-green-500 to-orange-500 text-foreground hover:opacity-90 transition-opacity dark:shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
