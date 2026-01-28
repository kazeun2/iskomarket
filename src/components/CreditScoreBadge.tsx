import React from 'react';
import { Shield, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface CreditScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function CreditScoreBadge({ score, size = 'md', showLabel = true }: CreditScoreBadgeProps) {
  const getScoreColor = () => {
    if (score >= 85) return 'bg-primary text-primary-foreground';
    if (score >= 70) return 'bg-secondary text-secondary-foreground';
    if (score >= 60) return 'bg-yellow-600 text-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getScoreIcon = () => {
    if (score >= 85) return <Shield className="h-3 w-3" />;
    if (score >= 60) return <AlertTriangle className="h-3 w-3" />;
    return <XCircle className="h-3 w-3" />;
  };

  const getScoreStatus = () => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Warning';
    return 'Critical';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge className={`${getScoreColor()} ${sizeClasses[size]} flex items-center gap-1.5`}>
      {getScoreIcon()}
      <span>{score} {showLabel && 'pts'}</span>
    </Badge>
  );
}
