import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { AlertTriangle, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAnnouncements } from '../contexts/AnnouncementContext';

interface SystemAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemAlertModal({ isOpen, onClose }: SystemAlertModalProps) {
  const { addSystemAlert } = useAnnouncements();
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'maintenance' | 'alert'>('maintenance');
  const [startAt, setStartAt] = useState<string>('');
  const [endAt, setEndAt] = useState<string>('');
  const [persistent, setPersistent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) {
      toast.error('Please enter an alert message');
      return;
    }

    if (alertType === 'maintenance' || alertType === 'alert') {
      // Validate start/end (unless persistent)
      if (!startAt || (!endAt && !persistent)) {
        toast.error('Please choose a start and end date/time for maintenance/alert');
        return;
      }
      const s = new Date(startAt);
      const e = persistent ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) : new Date(endAt);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e) {
        toast.error('Start time must be before end time');
        return;
      }

      setIsSubmitting(true);
      try {
        const { createMaintenanceWindow } = await import('../services/maintenanceService')
        const res = await createMaintenanceWindow({
          title: alertType === 'alert' ? 'Scheduled alert' : 'Scheduled maintenance',
          message: alertMessage.trim(),
          start_at: s.toISOString(),
          end_at: e.toISOString(),
          type: alertType === 'alert' ? 'alert' : 'maintenance',
          // created_by left blank; service will try to pick up if available
        } as any)

        if (res.error) {
          throw res.error
        }

        // If this is a maintenance window, also update the singleton maintenance_settings row so the app activates overlay immediately
        if (alertType === 'maintenance') {
          try {
            const ms = await import('../services/maintenanceSettingsService')
            const { data: msRow } = await ms.getMaintenanceStatus()
            if (msRow && msRow.id) {
              await ms.updateMaintenanceSettings(msRow.id, { is_active: true, title: res.data?.title || 'Scheduled maintenance', message: res.data?.message || alertMessage.trim(), updated_at: new Date().toISOString() })
            }
          } catch (e) {
            console.warn('Failed to set maintenance_settings active (non-fatal):', e)
          }
        }

        // Add to global context for real-time display only for immediate alerts
        addSystemAlert({ message: alertMessage.trim(), alertType })
        toast.success(`${alertType === 'alert' ? 'Alert' : 'Maintenance'} scheduled and notification sent`)
        setAlertMessage('')
        setStartAt('')
        setEndAt('')
        onClose()
      } catch (err) {
        console.error('Failed to schedule maintenance/alert:', err)
        toast.error('Failed to schedule maintenance/alert; see console for details')
      } finally {
        setIsSubmitting(false)
      }

      return
    }

    // Add to global context for real-time display
    addSystemAlert({
      message: alertMessage.trim(),
      alertType
    });

    toast.success('System alert sent to all users', {
      description: 'All active users will see this notification'
    });

    setAlertMessage('');
    onClose();
  };

  const useTemplate = () => {
    const maintenanceMessage = `⚠️ SCHEDULED MAINTENANCE

IskoMarket will be undergoing scheduled maintenance and will be temporarily unavailable.

📅 Duration: [Specify time frame]
🔧 Purpose: System upgrades and performance improvements

We apologize for any inconvenience. Please try again later.

- IskoMarket Admin Team`;

    const alertMessageTemplate = `🔔 SYSTEM ANNOUNCEMENT

[Enter your announcement here]

For questions or concerns, please contact the admin team.

- IskoMarket Admin Team`;

    setAlertMessage(alertType === 'maintenance' ? maintenanceMessage : alertMessageTemplate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col border rounded-[30px] dark:border-[rgba(0,255,150,0.18)] modal-standard"
        style={{
          background: 'rgba(240,255,248,0.40)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 4px 16px rgba(10,140,70,0.1)'
        }}
      >
        <div className="absolute inset-0 rounded-[30px] -z-10 dark:block hidden"
          style={{
            background: 'rgba(8, 22, 18, 0.60)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 4px 20px rgba(0,255,180,0.12)'
          }}
        />
        {/* Sticky Header - No gap at top */}
        <DialogHeader className="sticky top-0 z-10 border-b px-6 py-4 flex-shrink-0 border-[rgba(0,140,80,0.15)] dark:border-[rgba(0,255,180,0.08)]">
          <DialogTitle className="flex items-center gap-3 text-[#0c5e35] dark:text-[#DFFFF4]">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" 
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(255,180,0,0.45))'
                }}
              />
            </div>
            System Alert & Maintenance
          </DialogTitle>
          <DialogDescription className="mt-2 ml-[52px] text-[#3d7653] dark:text-[#8AD8B0]">
            Send a system-wide alert or maintenance notification to all users
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-4">
          {/* Alert Type Selection */}
          <div className="space-y-2">
            <label className="text-sm text-[#064E33] dark:text-[#DFFFF4]">Alert Type</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                className={alertType === 'maintenance' 
                  ? 'w-full bg-gradient-to-r from-[#0c8f4a] to-[#067232] text-white shadow-[0_0_12px_rgba(0,255,150,0.35)] hover:brightness-110' 
                  : 'w-full bg-transparent border-[rgba(0,120,60,0.35)] dark:border-[rgba(0,255,160,0.45)] text-[#3d7653] dark:text-[#7AD0A1] hover:bg-[rgba(0,120,60,0.05)] dark:hover:bg-[rgba(0,255,160,0.05)]'
                }
                onClick={() => setAlertType('maintenance')}
              >
                🔧 Maintenance
              </Button>
              <Button
                className={alertType === 'alert' 
                  ? 'w-full bg-gradient-to-r from-[#0c8f4a] to-[#067232] text-white shadow-[0_0_12px_rgba(0,255,150,0.35)] hover:brightness-110' 
                  : 'w-full bg-transparent border-[rgba(0,120,60,0.35)] dark:border-[rgba(0,255,160,0.45)] text-[#3d7653] dark:text-[#7AD0A1] hover:bg-[rgba(0,120,60,0.05)] dark:hover:bg-[rgba(0,255,160,0.05)]'
                }
                onClick={() => setAlertType('alert')}
              >
                🔔 Alert
              </Button>
            </div>
          </div>

          {/* Template Button */}
          <Button
            className="w-full bg-transparent border-[rgba(0,120,60,0.35)] dark:border-[rgba(0,255,160,0.45)] text-[#3d7653] dark:text-[#7AD0A1] hover:bg-[rgba(0,120,60,0.05)] dark:hover:bg-[rgba(0,255,160,0.05)]"
            onClick={useTemplate}
          >
            Use {alertType === 'maintenance' ? 'Maintenance' : 'Alert'} Template
          </Button>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm text-[#064E33] dark:text-[#DFFFF4]">Message</label>
            <Textarea
              placeholder="Enter your system alert message..."
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              rows={12}
              className="resize-none bg-white dark:bg-[rgba(14,24,20,0.55)] border-[rgba(0,128,64,0.18)] dark:border-[rgba(0,255,160,0.22)] text-[#064E33] dark:text-[#E9FFF4] focus:ring-2 focus:ring-[rgba(0,255,150,0.45)] transition-all"
            />
            <p className="text-xs text-[#7FAF97] dark:text-[#A8EFD0]">
              This message will be displayed to all active users
            </p>
          </div>

          {(alertType === 'maintenance' || alertType === 'alert') && (
            <div className="space-y-2 pt-2">
              <label className="text-sm text-[#064E33] dark:text-[#DFFFF4]">Schedule (local time)</label>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="flex flex-col">
                  <label htmlFor="startAt" className="text-xs text-[#064E33] dark:text-[#DFFFF4] mb-1">Start</label>
                  <input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full p-2 border rounded"
                    aria-label="Start date and time"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="endAt" className="text-xs text-[#064E33] dark:text-[#DFFFF4] mb-1">End</label>
                  <input
                    id="endAt"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full p-2 border rounded"
                    aria-label="End date and time"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input id="persistent" type="checkbox" checked={persistent} onChange={(e) => setPersistent(e.target.checked)} className="form-checkbox h-4 w-4" />
                <label htmlFor="persistent" className="text-sm text-[#064E33] dark:text-[#DFFFF4]">Persistent (do not auto-expire until manually cancelled)</label>
              </div>

              <p className="text-xs text-[#7FAF97] dark:text-[#A8EFD0]">Times are stored in UTC; this input uses your local timezone and will be converted to UTC on scheduling.</p>
            </div>
          )}
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 border-t px-6 py-4 border-[rgba(0,140,80,0.15)] dark:border-[rgba(0,255,180,0.08)] bg-[rgba(240,255,248,0.25)] dark:bg-[rgba(8,24,20,0.45)]"
          style={{
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="flex justify-end gap-3 pt-2">
            <Button
              className="flex-1 bg-transparent border-[rgba(0,120,60,0.35)] dark:border-[rgba(0,255,160,0.45)] text-[#3d7653] dark:text-[#7AD0A1] hover:bg-[rgba(0,120,60,0.05)] dark:hover:bg-[rgba(0,255,160,0.05)]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-[#FF7A30] to-[#E85B00] text-white shadow-[0_0_12px_rgba(255,120,40,0.4)] hover:brightness-110 hover:translate-y-[-1px] transition-all"
              onClick={handleSendAlert}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Scheduling...' : 'Send Alert'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}