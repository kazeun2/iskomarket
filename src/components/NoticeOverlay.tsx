import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Ban, Send } from 'lucide-react';
import { Badge } from './ui/badge';

export function NoticeOverlay({ mode = 'warn', user, onClose, onSend } : { mode?: 'warn'|'suspend', user?: any, onClose: () => void, onSend?: (mode: string, user: any) => void }) {
  const sending = false;

  return (
    <div className="w-full max-w-3xl p-4">
      <div className="bg-white dark:bg-[#04121a] rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            {mode === 'warn' ? <AlertTriangle className="h-5 w-5 text-orange-600" /> : <Ban className="h-5 w-5 text-red-600" />}
            <div>
              <div className="text-lg font-semibold">{mode === 'warn' ? 'Official Warning — Reported Account' : 'Account Suspension Notice'}</div>
              <div className="text-sm text-muted-foreground">{user?.username || 'User'}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-lg border-2 bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {mode === 'warn'
                ? `Hi ${user?.username},\n\nWe've noticed some activity on your account that may violate our community guidelines.\n\nYour account is currently under review by our moderation team.\n\nPlease wait for further updates while we complete our investigation.`
                : `Hi ${user?.username},\n\nDue to multiple or severe violations of our community guidelines, your account has been temporarily suspended.\n\nYou will be unable to access or post until our team completes a full review.\n\nWe will notify you once a decision has been made regarding your account status.`}
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium mb-2">What happens next:</p>
            <ul className="text-xs text-muted-foreground">
              <li>• A notification will be sent to the user</li>
              <li>• User will see a banner when they log in</li>
              <li>• Account will remain under review</li>
              <li>• Admin will be notified once the user responds or review is complete</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button
              className={`flex-1 ${mode === 'warn' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
              onClick={() => {
                if (typeof onSend === 'function') onSend(mode, user);
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Notice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}