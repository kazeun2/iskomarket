import React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from './ui/badge';

interface PriorityBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'full' | 'compact';
}

/**
 * Priority Badge for Top 5 Buyers
 * Displays an orange badge indicating the user has priority buyer status
 */
export function PriorityBadge({ 
  size = 'md', 
  showIcon = true,
  variant = 'full' 
}: PriorityBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 h-5',
    md: 'text-xs px-2 py-1 h-6',
    lg: 'text-sm px-2.5 py-1 h-7'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  };

  if (variant === 'compact') {
    return (
      <Badge 
        className={`${sizeClasses[size]} bg-gradient-to-r from-orange-500 to-orange-600 text-foreground border-0 shadow-sm flex items-center gap-1 flex-shrink-0`}
      >
        {showIcon && <Crown className={iconSizes[size]} />}
        <span>Priority</span>
      </Badge>
    );
  }

  return (
    <Badge 
      className={`${sizeClasses[size]} bg-gradient-to-r from-orange-500 to-orange-600 text-foreground border-0 shadow-sm flex items-center gap-1 flex-shrink-0`}
    >
      {showIcon && <Crown className={iconSizes[size]} />}
      <span>Priority Buyer</span>
    </Badge>
  );
}

/**
 * Check if a user is a Top 5 Buyer
 * @param userId - The user ID to check
 * @param topBuyersIds - Array of Top 5 Buyer IDs (default: [1, 2, 3, 4, 5])
 * @returns boolean indicating if user is a Top 5 Buyer
 */
export function isTopFiveBuyer(userId: number, topBuyersIds: number[] = [1, 2, 3, 4, 5]): boolean {
  return topBuyersIds.includes(userId);
}

/**
 * Get top buyers from the month
 * In a real application, this would fetch from the database
 * Returns the IDs of the current Top 5 Buyers
 */
export function getTopFiveBuyersIds(): number[] {
  // In production, this would fetch from your backend/database
  // For now, using the default IDs from TopFiveMembersSection
  return [1, 2, 3, 4, 5]; // Maria Bendo, Hazel Perez, Pauleen Angon, John Santos, Ana Garcia
}
