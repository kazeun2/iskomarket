import React from 'react';
import { Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface DailySpinCardProps {
  spinsLeft: number;
  rechargesLeft: number;
  onClick: () => void;
}

export function DailySpinCard({ spinsLeft, rechargesLeft, onClick }: DailySpinCardProps) {
  return (
    <motion.div
      className="relative cursor-pointer flex items-center justify-center"
      onClick={onClick}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.16 }}
    >
      {/* Glassmorphism Icon Container */}
      <div 
        className="relative h-12 w-12 rounded-full flex items-center justify-center border border-emerald-500/25 dark:border-emerald-400/25 backdrop-blur-[16px]"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.15) 100%)',
          boxShadow: `
            0 4px 10px rgba(0, 0, 0, 0.10),
            0 8px 20px rgba(0, 140, 70, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 0 20px rgba(16, 185, 129, 0.15)
          `,
        }}
      >
        {/* Top-left neon highlight */}
        <div 
          className="absolute -top-px -left-px w-6 h-6 rounded-full opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.8), transparent 60%)'
          }}
        />

        {/* Icon with gradient */}
        <div className="relative z-10">
          <Zap 
            className="h-6 w-6 text-emerald-400 dark:text-emerald-300 fill-emerald-400 dark:fill-emerald-300" 
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))'
            }}
          />
        </div>
        
        {/* Soft pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-emerald-400/60"
          animate={{
            scale: [1, 1.4],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </div>
    </motion.div>
  );
}
