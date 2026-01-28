import React, { useEffect } from 'react';
import { X, Clock, Search, CheckCircle, XCircle, AlertTriangle, FileText, Calendar, User } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

export type AppealStatus = 'pending' | 'under_evaluation' | 'approved' | 'rejected';

export interface AppealData {
  id: string;
  appealId: string;
  transactionTitle: string;
  otherPartyName: string;
  submittedDate: string;
  status: AppealStatus;
  reason: string;
  adminResponse?: string;
  resolvedDate?: string;
  evidenceCount: number;
}

interface AppealStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  appealData: AppealData | null;
}

const statusConfig: Record<AppealStatus, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}> = {
  pending: {
    icon: Clock,
    label: 'Pending Review',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    emoji: '⏳',
  },
  under_evaluation: {
    icon: Search,
    label: 'Under Evaluation',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    emoji: '🔍',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    emoji: '✅',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    emoji: '❌',
  },
};

export function AppealStatusModal({ isOpen, onClose, appealData }: AppealStatusModalProps) {
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;
  if (!appealData) return null;

  const config = statusConfig[appealData.status];
  const StatusIcon = config.icon;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[102] transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-[103] flex items-center justify-center p-4 pointer-events-none">
        <motion.div 
          className="bg-[var(--card)] dark:bg-gradient-to-br dark:from-[#1a2f1a] dark:via-[#1a2317] dark:to-[#1a1f1a] rounded-[24px] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[calc(100%-32px)] md:max-w-[540px] lg:max-w-[600px] max-h-[90vh] flex flex-col pointer-events-auto border border-gray-200 dark:border-green-900/20 dark:backdrop-blur-xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - sticky */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-green-900/20 dark:bg-gradient-to-r dark:from-[#1a2f1a]/80 dark:via-[#1a2317]/80 dark:to-[#1a1f1a]/80 backdrop-blur-sm">
            <div>
              <h2 className="text-[22px] md:text-[24px] flex items-center gap-2 dark:text-foreground">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-500" />
                Appeal Status
              </h2>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
                Appeal ID: {appealData.appealId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors text-green-600 dark:text-green-500"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-6">
              {/* Status Banner */}
              <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 dark:backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-12 h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <StatusIcon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-lg">{config.emoji}</span>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      {appealData.status === 'pending' && 'Your appeal has been submitted and is awaiting admin review.'}
                      {appealData.status === 'under_evaluation' && 'An admin is currently evaluating your appeal and evidence.'}
                      {appealData.status === 'approved' && 'Your appeal has been approved! Transaction marked as successful.'}
                      {appealData.status === 'rejected' && 'Your appeal has been reviewed and denied.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-muted/50 dark:bg-green-900/20 rounded-lg p-4 space-y-3 border border-transparent dark:border-green-900/20">
                <h3 className="font-medium text-sm mb-3 dark:text-foreground">Transaction Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mb-0.5">Product</p>
                      <p className="text-sm font-medium truncate dark:text-gray-200">{appealData.transactionTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mb-0.5">Other Party</p>
                      <p className="text-sm font-medium truncate dark:text-gray-200">{appealData.otherPartyName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mb-0.5">Submitted On</p>
                      <p className="text-sm font-medium dark:text-gray-200">{appealData.submittedDate}</p>
                    </div>
                  </div>

                  {appealData.resolvedDate && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mb-0.5">Resolved On</p>
                        <p className="text-sm font-medium dark:text-gray-200">{appealData.resolvedDate}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border dark:border-green-900/20">
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mb-1">Evidence Submitted</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    <p className="text-sm dark:text-gray-300">{appealData.evidenceCount} file(s) attached</p>
                  </div>
                </div>
              </div>

              {/* Appeal Reason */}
              <div>
                <h3 className="font-medium text-sm mb-2 dark:text-foreground">Your Appeal Reason</h3>
                <div className="bg-muted/30 dark:bg-green-900/20 rounded-lg p-4 border border-border dark:border-green-900/20">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap dark:text-gray-300">
                    {appealData.reason}
                  </p>
                </div>
              </div>

              {/* Admin Response */}
              {appealData.adminResponse && (
                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-2 dark:text-foreground">
                    Admin Response
                    {appealData.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {appealData.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                  </h3>
                  <div className={`rounded-lg p-4 border ${
                    appealData.status === 'approved' 
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  }`}>
                    <p className={`text-sm leading-relaxed ${
                      appealData.status === 'approved' 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {appealData.adminResponse}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <h3 className="font-medium text-sm mb-3 dark:text-foreground">Status Timeline</h3>
                <div className="space-y-3">
                  {/* Step 1: Pending */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      appealData.status === 'pending' || appealData.status === 'under_evaluation' || appealData.status === 'approved' || appealData.status === 'rejected'
                        ? 'bg-green-500 text-foreground'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-gray-200">Pending Review</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">Appeal submitted for review</p>
                    </div>
                  </div>

                  {/* Step 2: Under Evaluation */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      appealData.status === 'under_evaluation' || appealData.status === 'approved' || appealData.status === 'rejected'
                        ? 'bg-green-500 text-foreground'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-gray-200">Under Evaluation</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">Admin reviewing evidence</p>
                    </div>
                  </div>

                  {/* Step 3: Resolved */}
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      appealData.status === 'approved' || appealData.status === 'rejected'
                        ? appealData.status === 'approved' 
                          ? 'bg-green-500 text-foreground'
                          : 'bg-red-500 text-foreground'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {appealData.status === 'approved' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : appealData.status === 'rejected' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-gray-200">
                        {appealData.status === 'approved' ? 'Approved' : appealData.status === 'rejected' ? 'Rejected' : 'Awaiting Decision'}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        {appealData.status === 'approved' 
                          ? 'Appeal accepted - transaction marked successful'
                          : appealData.status === 'rejected'
                          ? 'Appeal denied - decision final'
                          : 'Waiting for admin decision'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              {appealData.status !== 'approved' && appealData.status !== 'rejected' && (
                <div className="bg-primary/10 dark:bg-green-900/30 border border-primary/30 dark:border-green-700/30 rounded-lg p-3">
                  <p className="text-xs text-center text-muted-foreground dark:text-gray-400">
                    💡 Appeals are typically reviewed within 24-48 hours. You will receive a notification once a decision is made.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer - sticky */}
          <div className="border-t border-gray-200 dark:border-green-900/20 px-6 py-4">
            <Button
              onClick={onClose}
              variant="default"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
