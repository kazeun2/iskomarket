import { X, AlertTriangle, ShieldAlert, FileText } from "lucide-react";
import { Notification } from "./NotificationsModal";
import { useState, useEffect } from "react";
import { CommunityGuidelines } from "./CommunityGuidelines";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warning: Notification | null;
}

export function WarningModal({ isOpen, onClose, warning }: WarningModalProps) {
  const [showGuidelines, setShowGuidelines] = useState(false);

  if (!isOpen || !warning) return null;

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-white z-[102] transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-[103] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#1a2f1a] dark:via-[#1a2317] dark:to-[#1a1f1a] rounded-[20px] md:rounded-[24px] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[440px] md:max-w-[600px] max-h-[90vh] flex flex-col pointer-events-auto border border-gray-200 dark:border-green-900/20 dark:backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - sticky */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-green-900/20 dark:bg-gradient-to-r dark:from-[#1a2f1a]/80 dark:via-[#1a2317]/80 dark:to-[#1a1f1a]/80 dark:backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{warning.emoji}</span>
              <h2 className="text-[22px] md:text-[24px] dark:text-white">Warning Notice</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-green-900/20 rounded-full transition-colors"
              aria-label="Close warning"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Warning banner */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 dark:backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-900 dark:text-red-100 mb-1">
                    {warning.title}
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    You have received an official warning for violating our community guidelines.
                  </p>
                </div>
              </div>
            </div>

            {/* Violation details */}
            <div className="space-y-6">
              <div>
                <h4 className="text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <ShieldAlert className="size-5" />
                  Violation Details
                </h4>
                
                <div className="bg-[var(--surface-soft)] dark:bg-green-900/20 rounded-2xl p-4 space-y-3 border border-transparent dark:border-green-900/20">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Reason:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      Posting Guideline Violation
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Product:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      "Textbook for Sale - Engineering Math"
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Issue:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      Product description contains prohibited external links and contact information
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Date:
                    </span>
                    <p className="text-gray-900 dark:text-gray-100">
                      {warning.timestamp}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning levels */}
              <div>
                <h4 className="text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="size-5" />
                  Warning System
                </h4>
                
                <div className="bg-gray-50 dark:bg-green-900/20 rounded-2xl p-4 border border-transparent dark:border-green-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-1/3 rounded-full" />
                    </div>
                    <span className="text-orange-600 dark:text-orange-400">
                      1 of 3 warnings
                    </span>
                  </div>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">⚠️</span>
                      <span>1st Warning: Official notice (current)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500">⚠️</span>
                      <span>2nd Warning: 7-day suspension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">🚫</span>
                      <span>3rd Warning: Permanent account ban</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action required */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 dark:backdrop-blur-sm">
                <h4 className="text-blue-900 dark:text-blue-100 mb-2">
                  Action Required
                </h4>
                <p className="text-blue-700 dark:text-blue-300">
                  Please review our Community Guidelines and ensure future posts comply with our policies. 
                  Your violating product has been removed from the marketplace.
                </p>
              </div>
            </div>
          </div>

          {/* Footer - sticky */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-green-900/20 space-y-2">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-green-500 to-orange-500 text-white hover:opacity-90 transition-opacity dark:shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
            >
              I Understand
            </button>
            <button
              onClick={() => setShowGuidelines(true)}
              className="w-full px-4 py-3 rounded-full bg-gray-100 dark:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-green-900/40 transition-colors border border-transparent dark:border-green-700/30"
            >
              View Community Guidelines
            </button>
          </div>
        </div>
      </div>

      {/* Community Guidelines Modal */}
      {showGuidelines && (
        <CommunityGuidelines isOpen={showGuidelines} onClose={() => setShowGuidelines(false)} />
      )}
    </>
  );
}