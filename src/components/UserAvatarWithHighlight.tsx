import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { CreditScoreRing } from './CreditScoreRing';
import { UsernameWithGlow } from './UsernameWithGlow';

interface UserAvatarWithHighlightProps {
  user: {
    name: string;
    username: string;
    avatar: string;
    creditScore: number;
    rank?: number;
    role?: 'buyer' | 'seller';
    glowEffect?: { name: string; active: boolean; expiresAt?: string } | null;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showRankTag?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function UserAvatarWithHighlight({
  user,
  size = 'md',
  showRankTag = false,
  showTooltip = true,
  className = ''
}: UserAvatarWithHighlightProps) {
  const { name, username, avatar, creditScore, rank, role } = user;

  // Size mappings
  const sizeMap = {
    xs: { avatar: 'h-6 w-6', badge: 'text-[10px] px-1 py-0', icon: 'text-[10px]' },
    sm: { avatar: 'h-8 w-8', badge: 'text-xs px-1.5 py-0.5', icon: 'text-xs' },
    md: { avatar: 'h-12 w-12', badge: 'text-xs px-2 py-0.5', icon: 'text-sm' },
    lg: { avatar: 'h-16 w-16', badge: 'text-sm px-2.5 py-1', icon: 'text-base' },
    xl: { avatar: 'h-24 w-24', badge: 'text-base px-3 py-1.5', icon: 'text-lg' }
  };

  // Credit Score Highlight System
  const getHighlightStyle = (score: number) => {
    if (score <= 60) {
      return {
        color: '#FF6B6B',
        status: 'At Risk – Under Review',
        borderWidth: '3px',
        animation: 'pulse-red'
      };
    } else if (score <= 69) {
      return {
        color: '#FFA500',
        status: 'Needs Improvement',
        borderWidth: '2px',
        animation: 'glow-orange'
      };
    } else if (score <= 79) {
      return {
        color: '#FFD43B',
        status: 'Developing',
        borderWidth: '2px',
        animation: 'fade-yellow'
      };
    } else if (score <= 99) {
      return {
        color: '#00C896',
        status: 'Trusted',
        borderWidth: '2px',
        animation: 'glow-green'
      };
    } else {
      return {
        color: '#00FFFF',
        status: 'Elite',
        borderWidth: '3px',
        animation: 'shimmer-cyan'
      };
    }
  };

  // Top 5 Rank Tag System
  const getRankTagStyle = (rankNum: number) => {
    switch (rankNum) {
      case 1:
        return {
          label: `Top ${role === 'buyer' ? 'Buyer' : 'Seller'}`,
          bgColor: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600',
          borderColor: '#FFD700',
          glow: 'shadow-[0_0_16px_rgba(255,215,0,0.6)]'
        };
      case 2:
        return {
          label: `Top ${role === 'buyer' ? 'Buyer' : 'Seller'}`,
          bgColor: 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-600',
          borderColor: '#00C896',
          glow: 'shadow-[0_0_12px_rgba(0,200,150,0.5)]'
        };
      case 3:
        return {
          label: `Top ${role === 'buyer' ? 'Buyer' : 'Seller'}`,
          bgColor: 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600',
          borderColor: '#D67B43',
          glow: 'shadow-[0_0_12px_rgba(214,123,67,0.5)]'
        };
      case 4:
        return {
          label: `Top ${role === 'buyer' ? 'Buyer' : 'Seller'}`,
          bgColor: 'bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-600',
          borderColor: '#5BC0EB',
          glow: 'shadow-[0_0_10px_rgba(91,192,235,0.4)]'
        };
      case 5:
        return {
          label: `Top ${role === 'buyer' ? 'Buyer' : 'Seller'}`,
          bgColor: 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500',
          borderColor: '#C0C0C0',
          glow: 'shadow-[0_0_8px_rgba(192,192,192,0.4)]'
        };
      default:
        return null;
    }
  };

  const highlightStyle = getHighlightStyle(creditScore);
  const rankTagStyle = rank && rank <= 5 && showRankTag ? getRankTagStyle(rank) : null;
  const isTop5 = rank && rank <= 5;

  // Map avatar size to credit ring size (25-30% of avatar)
  const ringSizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-[72px] h-[72px]'
  };

  const avatarContent = (
    <div className={`relative inline-block ${className}`}>
      {/* Avatar without credit ring */}
      <div className={`relative ${sizeMap[size].avatar} rounded-full transition-all duration-300 hover:scale-105`}>
        <Avatar className={`${sizeMap[size].avatar} transition-all duration-300`}>
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className={sizeMap[size].icon}>
            {name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>

        {/* Credit Score Ring Overlay - Removed */}
      </div>

      {/* Top 5 Rank Tag */}
      {rankTagStyle && (
        <div 
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap animate-fade-in-scale ${rankTagStyle.glow}`}
          style={{
            animationDelay: '400ms'
          }}
        >
          <Badge 
            className={`${rankTagStyle.bgColor} ${sizeMap[size].badge} text-foreground border-2 shadow-lg`}
            style={{ borderColor: rankTagStyle.borderColor }}
          >
            {rankTagStyle.label}
          </Badge>
        </div>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatarContent}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-semibold">{name}</span>{' '}
                <span className="text-sm text-muted-foreground">(
                  <UsernameWithGlow username={username} glowEffect={user.glowEffect} showTimer={false} className="inline" />
                )</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Credit Score: <span style={{ color: highlightStyle.color }}>{creditScore}/100</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Status: {highlightStyle.status}
              </p>
              {isTop5 && (
                <p className="text-xs text-primary">
                  Ranked #{rank} this season
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 italic">
                Your profile reflects your credibility and performance this season.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatarContent;
}

// CSS Animations (add to globals.css or use inline styles)
export const avatarAnimationStyles = `
@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes glow-orange {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

@keyframes fade-yellow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

@keyframes glow-green {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.9; }
}

@keyframes shimmer-cyan {
  0% { opacity: 0.7; filter: brightness(1); }
  50% { opacity: 1; filter: brightness(1.2); }
  100% { opacity: 0.7; filter: brightness(1); }
}

@keyframes fade-in-scale {
  0% {
    opacity: 0;
    transform: translate(-50%, 4px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.pulse-red {
  animation: pulse-red 1s ease-in-out infinite;
}

.glow-orange {
  animation: glow-orange 2s ease-in-out infinite;
}

.fade-yellow {
  animation: fade-yellow 2s ease-in-out infinite;
}

.glow-green {
  animation: glow-green 2s ease-in-out infinite;
}

.shimmer-cyan {
  animation: shimmer-cyan 1.5s ease-in-out infinite;
}

.animate-fade-in-scale {
  animation: fade-in-scale 0.4s ease-out forwards;
}
`;
