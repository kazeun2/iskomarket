import React from 'react';
import { X, AlertTriangle, Calendar, FileText, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface ReportWarningDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppeal?: () => void;
  report: {
    id: string;
    type: 'warning' | 'suspension' | 'appeal_approved' | 'appeal_rejected';
    title: string;
    reason: string;
    details: string;
    issuedDate: Date;
    severity: 'low' | 'medium' | 'high';
    canAppeal: boolean;
    reviewedBy?: string;
  };
}

export function ReportWarningDetailsModal({
  isOpen,
  onClose,
  onAppeal,
  report
}: ReportWarningDetailsModalProps) {
  if (!isOpen) return null;

  const getSeverityBadge = (severity: string) => {
    const styles = {
      low: { bg: '#FFA733', text: 'Low' },
      medium: { bg: '#FF6B6B', text: 'Medium' },
      high: { bg: '#E34B4B', text: 'High' }
    };
    
    const style = styles[severity as keyof typeof styles] || styles.medium;
    
    return (
      <Badge style={{ backgroundColor: style.bg, color: '#FFFFFF' }}>
        {style.text}
      </Badge>
    );
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'warning':
        return { icon: '⚠️', title: 'Warning Issued', color: '#FFA733' };
      case 'suspension':
        return { icon: '🚫', title: 'Account Suspended', color: '#E34B4B' };
      case 'appeal_approved':
        return { icon: '✅', title: 'Appeal Approved', color: '#3BAE5C' };
      case 'appeal_rejected':
        return { icon: '❌', title: 'Appeal Rejected', color: '#E34B4B' };
      default:
        return { icon: '📄', title: 'Report', color: '#666666' };
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const typeInfo = getTypeInfo(report.type);

  return (
    <div 
      className="fixed inset-0 bg-white dark:backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="modal-header-standard">
          <div className="modal-header-content">
            <div className="modal-header-text">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" style={{ color: typeInfo.color }} />
                <h2 className="modal-header-title">{typeInfo.title}</h2>
              </div>
              <p className="modal-header-description">
                Review the details below
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="modal-close-button-standard"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <ScrollArea className="max-h-[500px]">
          <div className="p-6 space-y-5">
            {/* Report Header */}
            <div 
              className="border-l-4 rounded-lg p-4"
              style={{ 
                borderColor: typeInfo.color,
                backgroundColor: report.type === 'appeal_approved' 
                  ? 'rgba(59, 174, 92, 0.1)' 
                  : 'rgba(227, 75, 75, 0.1)'
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{typeInfo.icon}</span>
                  <div>
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Report ID: {report.id}
                    </p>
                  </div>
                </div>
                {getSeverityBadge(report.severity)}
              </div>
            </div>

            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Issued Date</p>
                  <p className="font-medium">{formatDate(report.issuedDate)}</p>
                </div>
              </div>
              {report.reviewedBy && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Reviewed By</p>
                    <p className="font-medium">{report.reviewedBy}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Reason */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reason
              </h4>
              <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
                {report.reason}
              </p>
            </div>

            {/* Details */}
            <div>
              <h4 className="font-medium mb-2">Additional Details</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {report.details}
              </div>
            </div>

            {/* Appeal Info Banner */}
            {report.canAppeal && report.type === 'warning' && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ℹ️ If you believe this warning was issued incorrectly, you can submit an appeal for admin review.
                </p>
              </div>
            )}

            {report.type === 'appeal_approved' && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Your appeal has been reviewed and approved. The warning has been removed from your record.
                </p>
              </div>
            )}

            {report.type === 'appeal_rejected' && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ❌ After review, the admin team has determined that the original warning was valid and will remain on your record.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Modal Footer */}
        <div className="modal-footer-standard">
          {report.canAppeal && report.type === 'warning' && onAppeal ? (
            <>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onAppeal();
                  onClose();
                }}
                className="flex-1"
              >
                Submit Appeal
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
