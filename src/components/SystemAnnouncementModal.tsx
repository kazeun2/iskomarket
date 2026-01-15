import React, { useEffect } from "react";
import { X, Calendar, Clock } from "lucide-react";
import { Notification } from "./NotificationsModal";

interface SystemAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Notification | null;
}

export function SystemAnnouncementModal({
  isOpen,
  onClose,
  announcement,
}: SystemAnnouncementModalProps) {
  if (!isOpen || !announcement) return null;

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  // Check if this is a maintenance announcement to show specific content
  const isMaintenance = announcement.title.toLowerCase().includes("maintenance");

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
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-[var(--border)] dark:bg-[var(--card)] dark:backdrop-blur-sm">
            <h2 className="text-[22px] md:text-[24px] dark:text-white">System Announcement</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors text-green-600 dark:text-green-500"
              aria-label="Close announcement"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {isMaintenance ? (
              // Maintenance-specific content
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-gray-900 dark:text-white mb-3">
                    SCHEDULED MAINTENANCE
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    IskoMarket will be undergoing scheduled maintenance and will be temporarily unavailable.
                  </p>
                </div>

                <div className="bg-teal-50 dark:bg-[var(--card)] border border-teal-200 dark:border-[var(--border)] rounded-2xl p-5 space-y-3 dark:backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="size-5 text-teal-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-teal-900 dark:text-white">
                        <span>Duration: </span>
                        <span className="text-teal-700 dark:text-gray-300">December 1, 2025 - 2:00 PM to 4:00 PM</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="size-5 text-teal-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-teal-900 dark:text-white">
                        <span>Purpose: </span>
                        <span className="text-teal-700 dark:text-gray-300">System upgrades and performance improvements</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    We apologize for any inconvenience.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    – IskoMarket Admin Team
                  </p>
                </div>
              </div>
            ) : (
              // Generic announcement content
              <div className="space-y-4">
                <h3 className="text-gray-900 dark:text-white mb-4">
                  {announcement.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {announcement.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer - sticky */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-green-900/20">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-full bg-green-500 dark:bg-green-700 text-white hover:bg-green-600 dark:hover:bg-green-600 transition-colors shadow-md dark:shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}