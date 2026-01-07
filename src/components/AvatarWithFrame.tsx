import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface AvatarWithFrameProps {
  src?: string;
  alt?: string;
  fallback: string;
  frameEffect?: {
    collegeName: string;
    active: boolean;
    expiresAt?: string;
  } | null;
  showTimer?: boolean;
  currentUserId?: number;
  ownerId?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const COLLEGE_FRAMES: Record<string, { primary: string; secondary: string; accent: string }> = {
  'CEIT': { primary: '#FF6B00', secondary: '#1a1a1a', accent: '#FFFFFF' },
  'CEMDS': { primary: '#1E3A8A', secondary: '#C0C0C0', accent: '#FFD700' },
  'CON': { primary: '#60A5FA', secondary: '#FFFFFF', accent: '#93C5FD' },
  'CAS': { primary: '#991B1B', secondary: '#FFD700', accent: '#DC2626' },
  'CAFENR': { primary: '#15803D', secondary: '#92400E', accent: '#22C55E' },
  'CED': { primary: '#1E3A8A', secondary: '#FFD700', accent: '#3B82F6' },
  'CVMBS': { primary: '#0891B2', secondary: '#FFFFFF', accent: '#06B6D4' },
  'CSPEAR': { primary: '#DC2626', secondary: '#FFFFFF', accent: '#EF4444' },
  'CTHM': { primary: '#06B6D4', secondary: '#F59E0B', accent: '#14B8A6' }
};

const SIZE_MAP = {
  sm: { container: 'h-8 w-8', padding: 'p-0.5', avatar: 'h-7 w-7' },
  md: { container: 'h-10 w-10', padding: 'p-0.5', avatar: 'h-9 w-9' },
  lg: { container: 'h-12 w-12', padding: 'p-[3px]', avatar: 'h-[42px] w-[42px]' },
  xl: { container: 'h-16 w-16', padding: 'p-1', avatar: 'h-14 w-14' }
};

export function AvatarWithFrame({
  src,
  alt,
  fallback,
  frameEffect,
  showTimer = false,
  currentUserId,
  ownerId,
  size = 'md',
  className = ''
}: AvatarWithFrameProps) {
  const isActive = frameEffect?.active && frameEffect.expiresAt && new Date(frameEffect.expiresAt) > new Date();
  const frameColors = isActive && frameEffect?.collegeName ? COLLEGE_FRAMES[frameEffect.collegeName] : null;
  
  const sizeClasses = SIZE_MAP[size];
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!frameEffect?.expiresAt) return 0;
    const now = new Date();
    const expires = new Date(frameEffect.expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();
  const isOwner = currentUserId === ownerId;
  const shouldShowTimer = showTimer && isOwner && isActive;

  return (
    <div className="inline-flex flex-col items-center">
      <div 
        className={`${sizeClasses.container} rounded-full ${sizeClasses.padding} ${className}`}
        style={
          frameColors
            ? {
                background: `linear-gradient(135deg, ${frameColors.primary} 0%, ${frameColors.secondary} 100%)`,
                boxShadow: `0 0 12px ${frameColors.accent}40`
              }
            : undefined
        }
      >
        <Avatar className={`${sizeClasses.avatar} shadow-elev-1`}>
          <AvatarImage src={src} alt={alt} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </div>
      {shouldShowTimer && daysRemaining > 0 && (
        <span className="text-[10px] text-muted-foreground italic mt-1">
          ⏳ {daysRemaining}d left
        </span>
      )}
    </div>
  );
}
