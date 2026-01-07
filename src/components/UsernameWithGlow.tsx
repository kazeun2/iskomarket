import React from 'react';
import { Check } from 'lucide-react';

interface UsernameWithGlowProps {
  username: string;
  glowEffect?: {
    name: string;
    active: boolean;
    expiresAt?: string;
  } | null;
  showTimer?: boolean;
  currentUserId?: number;
  ownerId?: number;
  className?: string;
}

const GLOW_STYLES: Record<string, { color: string; shadow: string }> = {
  'Glow Green': {
    color: 'text-green-600 dark:text-green-400',
    shadow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]'
  },
  'Golden Pulse': {
    color: 'text-amber-500',
    shadow: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]'
  },
  'Aqua Drift': {
    color: 'text-cyan-500',
    shadow: 'drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]'
  }
};

export function UsernameWithGlow({
  username,
  glowEffect,
  showTimer = false,
  currentUserId,
  ownerId,
  className = ''
}: UsernameWithGlowProps) {
  const isActive = glowEffect?.active && glowEffect.expiresAt && new Date(glowEffect.expiresAt) > new Date();
  const glowStyle = isActive && glowEffect?.name ? GLOW_STYLES[glowEffect.name] : null;
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!glowEffect?.expiresAt) return 0;
    const now = new Date();
    const expires = new Date(glowEffect.expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();
  const isOwner = currentUserId === ownerId;
  const shouldShowTimer = showTimer && isOwner && isActive;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span 
        className={`
          ${glowStyle ? `${glowStyle.color} ${glowStyle.shadow} animate-pulse` : ''}
          ${className}
        `}
      >
        @{username}
      </span>
      {shouldShowTimer && daysRemaining > 0 && (
        <span className="text-[10px] text-muted-foreground italic">
          Active ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)
        </span>
      )}
    </span>
  );
}