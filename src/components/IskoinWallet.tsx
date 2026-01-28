import React from 'react';
import { Lock, TrendingUp, Award, Info } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';

interface IskoinWalletProps {
  iskoins: number;
  isLocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'card' | 'badge' | 'inline';
  showAnimation?: boolean;
  className?: string;
}

export function IskoinWallet({
  iskoins,
  isLocked,
  size = 'md',
  variant = 'card',
  showAnimation = true,
  className = ''
}: IskoinWalletProps) {

  const sizeConfig = {
    sm: {
      coinSize: 'h-6 w-6',
      coinText: 'text-xs',
      valueText: 'text-sm',
      padding: 'p-2',
      gap: 'gap-2'
    },
    md: {
      coinSize: 'h-8 w-8',
      coinText: 'text-sm',
      valueText: 'text-base',
      padding: 'p-3',
      gap: 'gap-3'
    },
    lg: {
      coinSize: 'h-10 w-10',
      coinText: 'text-base',
      valueText: 'text-lg',
      padding: 'p-4',
      gap: 'gap-4'
    }
  };

  const config = sizeConfig[size];

  // Animated coin component with glow
  const AnimatedCoin = () => (
    <div className="relative">
      {/* Glow effect */}
      {!isLocked && showAnimation && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full blur-md opacity-50"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Coin */}
      <motion.div
        className={`relative ${config.coinSize} bg-gradient-to-br ${
          isLocked 
            ? 'from-gray-300 to-gray-500 dark:from-gray-600 dark:to-gray-800' 
            : 'from-amber-400 to-amber-600'
        } rounded-full flex items-center justify-center shadow-lg`}
        animate={!isLocked && showAnimation ? {
          rotateY: [0, 360],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <span className={`${config.coinText} ${isLocked ? 'text-gray-100' : 'text-foreground'}`}>
          🪙
        </span>
      </motion.div>

      {/* Lock icon overlay */}
      {isLocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 h-4 w-4 bg-background rounded-full flex items-center justify-center shadow-md"
        >
          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
        </motion.div>
      )}
    </div>
  );

  // Inline variant (minimal, for headers)
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center ${config.gap} ${className}`}>
        <AnimatedCoin />
        <span className={`${config.valueText} font-medium ${
          isLocked 
            ? 'text-muted-foreground line-through' 
            : 'text-amber-600 dark:text-amber-400'
        }`}>
          {iskoins}
        </span>
      </div>
    );
  }

  // Badge variant (compact without tooltip) - With gradient orange tone
  if (variant === 'badge') {
    return (
      <motion.div 
        className={`inline-flex items-center ${config.gap} ${config.padding} rounded-full ${
          isLocked 
            ? 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700' 
            : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-300 dark:border-amber-700'
        } ${className}`}
        animate={!isLocked && showAnimation ? { 
          y: [0, -2, 0],
          scale: [1, 1.02, 1]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <AnimatedCoin />
        <span className={`${config.valueText} font-medium ${
          isLocked 
            ? 'text-muted-foreground' 
            : 'text-amber-700 dark:text-amber-300'
        }`}>
          {iskoins} Iskoins
        </span>
        {isLocked && (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
      </motion.div>
    );
  }

  // Card variant (full display)
  return (
    <Card className={`${isLocked ? 'opacity-75' : ''} ${className}`}>
      <CardContent className={config.padding}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AnimatedCoin />
              <span className="text-sm font-medium text-foreground">
                Iskoin Wallet
              </span>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <IskoinTooltipContent iskoins={iskoins} isLocked={isLocked} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Balance */}
          <div className="space-y-1">
            <div className={`text-2xl font-medium ${
              isLocked 
                ? 'text-muted-foreground' 
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {isLocked && <span className="line-through">{iskoins}</span>}
              {!isLocked && iskoins}
              <span className="text-sm ml-2 text-muted-foreground">
                Iskoins
              </span>
            </div>
            
            {isLocked ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Locked until you reach 100 Credit Points</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>Active and earning</span>
              </div>
            )}
          </div>

          {/* Earning info */}
          {!isLocked && (
            <div className="p-2 bg-primary/5 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Award className="h-3 w-3 text-primary" />
                <span>Keep 100 credits for 1 week = +1 Iskoin</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Iskoin display for dashboard headers
 */
export function IskoinWalletCompact({
  iskoins,
  isLocked,
  className = ''
}: {
  iskoins: number;
  isLocked: boolean;
  className?: string;
}) {
  return (
    <IskoinWallet
      iskoins={iskoins}
      isLocked={isLocked}
      size="sm"
      variant="badge"
      showAnimation={true}
      className={className}
    />
  );
}

/**
 * Inline Iskoin display for profile sections
 */
export function IskoinWalletInline({
  iskoins,
  isLocked,
  className = ''
}: {
  iskoins: number;
  isLocked: boolean;
  className?: string;
}) {
  return (
    <IskoinWallet
      iskoins={iskoins}
      isLocked={isLocked}
      size="md"
      variant="inline"
      showAnimation={true}
      className={className}
    />
  );
}

/**
 * Tooltip content for Iskoin information
 */
function IskoinTooltipContent({ 
  iskoins, 
  isLocked 
}: { 
  iskoins: number; 
  isLocked: boolean;
}) {
  return (
    <div className="space-y-2 max-w-xs">
      <div>
        <p className="font-medium text-sm">Iskoin Wallet</p>
        <p className="text-xs text-muted-foreground">
          {iskoins} Iskoins earned
        </p>
      </div>
      
      {isLocked ? (
        <div className="space-y-1">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            🔒 Currently Locked
          </p>
          <p className="text-xs text-muted-foreground">
            Reach 100 Credit Points to unlock your Iskoins and resume earning.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
            ✓ Active & Earning
          </p>
          <p className="text-xs text-muted-foreground">
            Earn Iskoins by:
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5 ml-2">
            <li>• Maintaining 100 credits for 1 week (+1)</li>
            <li>• First time reaching 100 this season (+10)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Animated Iskoin earn notification
 */
export function IskoinEarnAnimation({ onComplete }: { onComplete?: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0, y: 50, opacity: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
        y: [50, -20, 0],
        opacity: [0, 1, 1]
      }}
      exit={{ 
        scale: 0,
        y: -50,
        opacity: 0
      }}
      transition={{ 
        duration: 0.6,
        times: [0, 0.6, 1],
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
    >
      <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 rounded-2xl shadow-2xl">
        <motion.div
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 1.5,
            repeat: 3,
            ease: "linear"
          }}
          className="text-6xl mb-2"
        >
          🪙
        </motion.div>
        <div className="text-center text-foreground">
          <div className="text-xl font-medium">+1 Iskoin!</div>
          <div className="text-sm opacity-90">Keep up the great work!</div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Calculate if user should earn Iskoins
 */
export function checkIskoinEarning(
  creditScore: number,
  daysAt100: number,
  hasReached100ThisSeason: boolean,
  currentIskoins: number
): {
  earnedIskoins: number;
  reason: string;
  newTotal: number;
} {
  let earned = 0;
  let reason = '';

  // First time reaching 100 this season
  if (creditScore === 100 && !hasReached100ThisSeason) {
    earned += 10; // 🔥 Changed from 1 to 10 Iskoins for first-time bonus
    reason = 'First time reaching 100 this season!';
  }

  // Maintaining 100 for a full week
  if (creditScore === 100 && daysAt100 >= 7 && daysAt100 % 7 === 0) {
    earned += 1;
    reason = earned > 1 
      ? 'First 100 + maintained for 1 week!' 
      : 'Maintained 100 credits for 1 week!';
  }

  return {
    earnedIskoins: earned,
    reason,
    newTotal: currentIskoins + earned
  };
}

/**
 * Check if Iskoins should be locked
 */
export function shouldLockIskoins(creditScore: number): boolean {
  return creditScore < 100;
}
