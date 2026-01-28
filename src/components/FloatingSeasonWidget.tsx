import React, { useEffect } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';

interface FloatingSeasonWidgetProps {
  onClick: () => void;
  currentSeason: string;
  shouldAutoOpen?: boolean;
  onAutoOpen?: () => void;
}

export function FloatingSeasonWidget({
  onClick,
  currentSeason,
  shouldAutoOpen = false,
  onAutoOpen
}: FloatingSeasonWidgetProps) {
  // Auto-open modal on login if it's a new season and user hasn't seen it yet
  useEffect(() => {
    if (shouldAutoOpen && onAutoOpen) {
      // Auto-open after 2 seconds delay (slightly after Daily Spin if both are present)
      const timer = setTimeout(() => {
        onAutoOpen();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount

  // Always show widget during the entire season (no hiding)
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-[8rem] left-6 z-[9999]"
    >
      <motion.button
        onClick={onClick}
        className="relative group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Main button - Premium Green/Emerald Style */}
        <div className="relative h-11 w-11 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
            boxShadow: '0 4px 8px rgba(16, 185, 129, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          {/* 3D Trophy Icon with depth */}
          <motion.div
            className="relative"
            animate={{
              rotateY: [0, 360]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
            }}
          >
            <Trophy className="h-5 w-5 text-foreground" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))' }} />
          </motion.div>

          {/* Sparkle particles */}
          <motion.div
            className="absolute -top-0.5 -right-0.5"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" style={{ filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.8))' }} />
          </motion.div>

          {/* Pulse ring animation */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-emerald-400"
            animate={{
              scale: [1, 1.4],
              opacity: [0.8, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />

          {/* "NEW" Badge */}
          <div className="absolute -top-1 -right-1 bg-transparent p-0.5">
            <Badge className="h-5 px-1.5 min-w-[20px] rounded-full flex items-center justify-center bg-gradient-to-r from-amber-500 to-yellow-500 text-foreground border-2 border-white shadow-md text-[8px] font-bold">
              NEW
            </Badge>
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-100 text-foreground dark:text-gray-900 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>Season Info</span>
            </div>
            <div className="text-xs mt-1 opacity-80">
              {currentSeason}
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900 dark:border-r-gray-100" />
        </div>
      </motion.button>
    </motion.div>
  );
}
