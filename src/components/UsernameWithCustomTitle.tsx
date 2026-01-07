import React from 'react';
import { Check } from 'lucide-react';

interface UsernameWithCustomTitleProps {
  username: string;
  customTitle?: string;
  customTitleExpiry?: string;
  className?: string;
  showTitleOnly?: boolean;
}

export function UsernameWithCustomTitle({
  username,
  customTitle,
  customTitleExpiry,
  className = '',
  showTitleOnly = false
}: UsernameWithCustomTitleProps) {
  // Check if custom title is expired
  const isExpired = customTitleExpiry ? new Date(customTitleExpiry) < new Date() : true;
  const hasActiveTitle = customTitle && !isExpired;

  // Custom title feature removed - only render username now
  return (
    <div className={`flex ${className}`}>
      <span>{username}</span>
    </div>
  );
}
