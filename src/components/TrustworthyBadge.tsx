import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TrustworthyBadgeProps {
  creditScore: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'full' | 'icon-only';
}

export function TrustworthyBadge({ 
  creditScore, 
  size = 'md', 
  showLabel = true,
  variant = 'full' 
}: TrustworthyBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Determine badge status based on credit score
  const getBadgeStatus = () => {
    if (creditScore >= 90) {
      return {
        type: 'trustworthy',
        label: 'Trustworthy',
        icon: <ShieldCheck className={iconSizes[size]} />,
        className: 'bg-gradient-to-r from-green-600 to-emerald-600 text-foreground border-0 shadow-md',
        emoji: '✅',
        accessLevel: 'Full access – buy, sell, message, view profiles',
        description: 'Verified credibility and consistent positive marketplace behavior'
      };
    } else if (creditScore >= 61) {
      // No badge shown for normal members (61-89)
      return null;
    } else {
      return {
        type: 'under-review',
        label: 'Under Review',
        icon: <ShieldAlert className={iconSizes[size]} />,
        className: 'bg-gradient-to-r from-red-600 to-rose-600 text-foreground border-0 shadow-md',
        emoji: '🔴',
        accessLevel: 'Limited access – can only view marketplace listings',
        description: 'Account under review – subject to removal. Cannot contact sellers, view seller profiles, or post products until trust is rebuilt'
      };
    }
  };

  const status = getBadgeStatus();

  // Don't render anything for normal members (61-89)
  if (!status) {
    return null;
  }

  if (variant === 'icon-only') {
    return (
      <div className="inline-flex">
        <Badge className={`${status.className} ${sizeClasses[size]} flex items-center justify-center p-1.5`}>
          {status.icon}
        </Badge>
      </div>
    );
  }

  return (
    <div className="inline-flex">
      <Badge className={`${status.className} ${sizeClasses[size]} flex items-center gap-1.5`}>
        {status.icon}
        {showLabel && <span>{status.label}</span>}
      </Badge>
    </div>
  );
}

// Helper function to check user access level based on credit score
export function getUserAccessLevel(creditScore: number): 'full' | 'normal' | 'restricted' {
  if (creditScore >= 90) return 'full';
  if (creditScore >= 61) return 'normal';
  return 'restricted';
}

// Helper function to check if user can perform specific actions
export function canUserPerformAction(creditScore: number, action: 'post' | 'chat' | 'view-profile' | 'browse'): boolean {
  const accessLevel = getUserAccessLevel(creditScore);
  
  switch (action) {
    case 'browse':
      return true; // Everyone can browse
    case 'post':
    case 'chat':
    case 'view-profile':
      return accessLevel !== 'restricted'; // Restricted users cannot do these
    default:
      return false;
  }
}

// Helper function to get restriction message
export function getRestrictionMessage(creditScore: number, action: string): string | null {
  if (creditScore > 60) return null;
  
  const messages = {
    post: 'Your account is under review and subject to removal. You cannot post products until your credit score improves to 61 or above.',
    chat: 'Your account is under review and subject to removal. You cannot contact sellers until your credit score improves to 61 or above.',
    'view-profile': 'Your account is under review and subject to removal. You cannot view seller profiles until your credit score improves to 61 or above.'
  };
  
  return messages[action as keyof typeof messages] || 'Your account is under review – subject to removal. Limited access until credit score improves.';
}
