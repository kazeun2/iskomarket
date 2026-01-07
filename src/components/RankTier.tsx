import * as React from 'react';
import { Shield, Leaf, Zap, Award, Gem, Crown, ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';

interface RankTierProps {
  creditScore: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

interface TierInfo {
  title: string;
  symbol: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any; // React component (icon)
  textColor: string;
  darkBgColor: string;
  darkTextColor: string;
  darkBorderColor: string;
}

export function RankTier({ 
  creditScore, 
  size = 'sm', 
  showLabel = true,
  showIcon = true,
  className = '' 
}: RankTierProps) {
  
  const getTierInfo = (): TierInfo => {
    if (creditScore === 100) {
      return {
        title: '👑 Elite Isko',
        symbol: '👑',
        description: 'Perfect record - Radiant blue shimmer',
        color: '#00C6FF', // Diamond Blue
        bgColor: 'bg-cyan-50',
        textColor: 'text-cyan-700',
        borderColor: 'border-cyan-300',
        darkBgColor: 'dark:bg-cyan-950/40',
        darkTextColor: 'dark:text-cyan-300',
        darkBorderColor: 'dark:border-cyan-700',
        icon: Crown
      };
    } else if (creditScore >= 90) {
      return {
        title: '🌟 Trustworthy Isko',
        symbol: '🌟',
        description: 'High reputation - Gold glow',
        color: '#FFD700', // Gold
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-300',
        darkBgColor: 'dark:bg-amber-950/40',
        darkTextColor: 'dark:text-amber-300',
        darkBorderColor: 'dark:border-amber-700',
        icon: Gem
      };
    } else if (creditScore >= 80) {
      return {
        title: '🪙 Reliable Isko',
        symbol: '🪙',
        description: 'Clean record - Mint glow',
        color: '#A9D4C9', // Silver/Mint
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        darkBgColor: 'dark:bg-green-950/40',
        darkTextColor: 'dark:text-green-300',
        darkBorderColor: 'dark:border-green-700',
        icon: Award
      };
    } else if (creditScore >= 70) {
      return {
        title: '✴️ Active Isko',
        symbol: '✴️',
        description: 'Consistent - Soft shine',
        color: '#F5C542', // Yellow
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        darkBgColor: 'dark:bg-yellow-950/40',
        darkTextColor: 'dark:text-yellow-300',
        darkBorderColor: 'dark:border-yellow-700',
        icon: Zap
      };
    } else if (creditScore >= 61) {
      return {
        title: '🍂 Trainee Isko',
        symbol: '🍂',
        description: 'Rebuilding - Bronze tint',
        color: '#D09455', // Bronze
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        darkBgColor: 'dark:bg-orange-950/40',
        darkTextColor: 'dark:text-orange-300',
        darkBorderColor: 'dark:border-orange-700',
        icon: Leaf
      };
    } else {
      return {
        title: '🕊 Unranked Isko',
        symbol: '🕊',
        description: 'New/Under Review - Silver glow',
        color: '#C0C0C0', // Silver/Gray
        bgColor: 'bg-[var(--surface-soft)]',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300',
        darkBgColor: 'dark:bg-gray-950/40',
        darkTextColor: 'dark:text-gray-300',
        darkBorderColor: 'dark:border-gray-700',
        icon: ShieldAlert
      };
    }
  };

  const tierInfo = getTierInfo();
  const IconComponent = tierInfo.icon;

  // Size configurations
  const sizeConfig = {
    xs: {
      padding: 'px-1.5 py-0.5',
      text: 'text-[10px]',
      iconSize: 'h-2.5 w-2.5',
      gap: 'gap-1'
    },
    sm: {
      padding: 'px-2 py-0.5',
      text: 'text-xs',
      iconSize: 'h-3 w-3',
      gap: 'gap-1'
    },
    md: {
      padding: 'px-2.5 py-1',
      text: 'text-sm',
      iconSize: 'h-3.5 w-3.5',
      gap: 'gap-1.5'
    },
    lg: {
      padding: 'px-3 py-1.5',
      text: 'text-base',
      iconSize: 'h-4 w-4',
      gap: 'gap-2'
    }
  };

  const config = sizeConfig[size];

  // Compact badge version (for under username)
  if (!showLabel && !showIcon) {
    return (
      <span
        className={`inline-block ${config.padding} rounded-full ${tierInfo.bgColor} ${tierInfo.textColor} ${tierInfo.darkBgColor} ${tierInfo.darkTextColor} border ${tierInfo.borderColor} ${tierInfo.darkBorderColor} ${config.text} font-medium ${className}`}
      >
        {tierInfo.symbol}
      </span>
    );
  }

  // Full badge with label and/or icon
  return (
    <div
      className={`inline-flex items-center ${config.gap} ${config.padding} rounded-full ${tierInfo.bgColor} ${tierInfo.textColor} ${tierInfo.darkBgColor} ${tierInfo.darkTextColor} border ${tierInfo.borderColor} ${tierInfo.darkBorderColor} ${className}`}
    >
      {showIcon && (
        <IconComponent 
          className={config.iconSize} 
          style={{ color: tierInfo.color }}
        />
      )}
      {showLabel && (
        <span className={`${config.text} font-medium whitespace-nowrap`}>
          {tierInfo.title}
        </span>
      )}
    </div>
  );
}

/**
 * Compact version for display under usernames
 */
export function RankTierCompact({ 
  creditScore, 
  className = '' 
}: { 
  creditScore: number; 
  className?: string; 
}) {
  return (
    <RankTier 
      creditScore={creditScore}
      size="xs"
      showLabel={true}
      showIcon={false}
      className={className}
    />
  );
}

/**
 * Icon-only version
 */
export function RankTierIcon({ 
  creditScore, 
  size = 'sm',
  className = '' 
}: { 
  creditScore: number; 
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string; 
}) {
  return (
    <RankTier 
      creditScore={creditScore}
      size={size}
      showLabel={false}
      showIcon={true}
      className={className}
    />
  );
}

/**
 * Get tier information without rendering
 */
export function getRankTierInfo(creditScore: number) {
  if (creditScore === 100) {
    return {
      title: 'Elite Isko Member',
      symbol: '🧠',
      shortTitle: 'Elite',
      description: 'Perfect record',
      tier: 6
    };
  } else if (creditScore >= 90) {
    return {
      title: 'Trustworthy Isko',
      symbol: '💎',
      shortTitle: 'Trustworthy',
      description: 'High reputation',
      tier: 5
    };
  } else if (creditScore >= 80) {
    return {
      title: 'Reliable Isko',
      symbol: '🟢',
      shortTitle: 'Reliable',
      description: 'Clean record',
      tier: 4
    };
  } else if (creditScore >= 70) {
    return {
      title: 'Active Isko',
      symbol: '🔰',
      shortTitle: 'Active',
      description: 'Consistent',
      tier: 3
    };
  } else if (creditScore >= 61) {
    return {
      title: 'Trainee Isko',
      symbol: '🪶',
      shortTitle: 'Trainee',
      description: 'Rebuilding',
      tier: 2
    };
  } else {
    return {
      title: 'Unranked Isko',
      symbol: '⚪',
      shortTitle: 'Unranked',
      description: 'New/Under Review',
      tier: 1
    };
  }
}
