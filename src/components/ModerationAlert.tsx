import React from 'react';
import { AlertTriangle, Ban, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ModerationAlertProps {
  key?: any;
  type: 'warning' | 'ban' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export function ModerationAlert({ type, title, message, onDismiss }: ModerationAlertProps) {
  const getAlertConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: title || 'Content Warning',
          className: 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-200'
        };
      case 'ban':
        return {
          icon: <Ban className="h-5 w-5" />,
          title: title || 'Messaging Restriction',
          className: 'border-destructive bg-destructive/10 text-destructive'
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5" />,
          title: title || 'Information',
          className: 'border-primary bg-primary/10 text-primary'
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          title: title || 'Notice',
          className: ''
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Alert className={config.className}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription className="mt-2">
            {message}
          </AlertDescription>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-current hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </Alert>
  );
}
