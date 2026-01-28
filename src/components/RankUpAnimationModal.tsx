import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Award, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

interface RankUpAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldTier: string;
  newTier: string;
  newScore: number;
  onViewTier: () => void;
}

// Tier configurations with colors and glows
const tierConfig: Record<string, { 
  color: string; 
  glow: string; 
  gradient: string; 
  textColor: string;
  emoji: string;
}> = {
  'Unranked Isko': { 
    color: '#EF4444', 
    glow: 'rgba(239, 68, 68, 0.6)', 
    gradient: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
    textColor: '#FEE2E2',
    emoji: '🔴'
  },
  'Trainee Isko': { 
    color: '#F97316', 
    glow: 'rgba(249, 115, 22, 0.6)', 
    gradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
    textColor: '#FED7AA',
    emoji: '🟠'
  },
  'Active Isko': { 
    color: '#EAB308', 
    glow: 'rgba(234, 179, 8, 0.6)', 
    gradient: 'linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)',
    textColor: '#FEF3C7',
    emoji: '🟡'
  },
  'Reliable Isko': { 
    color: '#22C55E', 
    glow: 'rgba(34, 197, 94, 0.6)', 
    gradient: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
    textColor: '#DCFCE7',
    emoji: '🟢'
  },
  'Trusted Isko': { 
    color: '#06B6D4', 
    glow: 'rgba(6, 182, 212, 0.6)', 
    gradient: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
    textColor: '#CFFAFE',
    emoji: '🔵'
  },
  'Elite Isko': { 
    color: '#00FFFF', 
    glow: 'rgba(0, 255, 255, 0.8)', 
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #00FFFF 100%)',
    textColor: '#ECFEFF',
    emoji: '⭐'
  },
};

export function RankUpAnimationModal({ 
  isOpen, 
  onClose, 
  oldTier, 
  newTier, 
  newScore,
  onViewTier 
}: RankUpAnimationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const oldConfig = tierConfig[oldTier] || tierConfig['Unranked Isko'];
  const newConfig = tierConfig[newTier] || tierConfig['Active Isko'];

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setTimeout(() => setShowContent(true), 300);
    } else {
      setShowConfetti(false);
      setShowContent(false);
    }
  }, [isOpen]);

  const handleViewTier = () => {
    onClose();
    setTimeout(() => onViewTier(), 150);
  };

  // Generate random confetti particles
  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFA07A', '#9B59B6', '#3498DB'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1.5,
    rotation: Math.random() * 360,
    xOffset: (Math.random() - 0.5) * 150,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="modal-standard max-w-2xl p-0 overflow-hidden border-0 bg-[var(--card)] dark:bg-transparent shadow-none"
        aria-describedby="rank-up-description"
      >
        <DialogTitle className="sr-only">
          Rank Up Celebration
        </DialogTitle>
        <DialogDescription id="rank-up-description" className="sr-only">
          Congratulations! You have advanced to {newTier}. View your new tier details.
        </DialogDescription>

        {/* Confetti Layer */}
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[10001]">
              {confettiPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    left: `${piece.left}%`,
                    top: '-5%',
                    background: piece.color,
                  }}
                  initial={{ y: 0, x: 0, rotate: 0, opacity: 1, scale: 1 }}
                  animate={{
                    y: '110vh',
                    x: piece.xOffset,
                    rotate: piece.rotation * 4,
                    opacity: [1, 1, 0],
                    scale: [1, 1.2, 0.8],
                  }}
                  transition={{
                    duration: piece.duration,
                    delay: piece.delay,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main Modal Container */}
        <div 
          className="relative rounded-[24px] overflow-hidden dark:backdrop-blur-[24px]"
          style={{
            boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 64px ${newConfig.glow}`,
          }}
        >
          {/* Dark Mode Background */}
          <div 
            className="absolute inset-0 dark:opacity-100 opacity-0"
            style={{
              background: 'linear-gradient(180deg, rgba(0, 15, 30, 0.98) 0%, rgba(0, 30, 60, 0.98) 100%)',
            }}
          />

          {/* Light Mode Background */}
          <div 
            className="absolute inset-0 dark:opacity-0 opacity-100"
            style={{
              background: 'linear-gradient(180deg, rgba(245, 250, 247, 1) 0%, rgba(240, 248, 243, 1) 100%)',
            }}
          />

          {/* Animated Gradient Overlay (kept but lowered in light mode) */}
          <motion.div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, ${newConfig.glow}, transparent 70%)`,
              opacity: 0.12,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: newConfig.color,
                boxShadow: `0 0 8px ${newConfig.glow}`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Content Container */}
          <div className="relative z-10 p-8">
            {/* Top Section - Tier Transition */}
            <AnimatePresence mode="wait">
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center space-y-6 mb-8"
                >
                  {/* Sparkles Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.3,
                    }}
                    className="flex justify-center"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{
                        background: newConfig.gradient,
                        boxShadow: `0 0 40px ${newConfig.glow}, inset 0 0 20px rgba(255,255,255,0.2)`,
                      }}
                    >
                      <Award className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>

                  {/* Congratulations Text */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <h2 
                      className="text-3xl font-bold"
                      style={{ 
                        color: newConfig.textColor,
                        textShadow: `0 0 20px ${newConfig.glow}`,
                      }}
                    >
                      🎉 Congratulations! 🎉
                    </h2>
                    <p className="text-lg text-gray-300">
                      You've been promoted to a new tier!
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tier Transition Animation */}
            <motion.div 
              className="relative py-12 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {/* Old Tier (Left) */}
              <motion.div
                className="absolute left-[5%] top-1/2 -translate-y-1/2"
                initial={{ x: 0, opacity: 1, scale: 1 }}
                animate={{ 
                  x: -50, 
                  opacity: 0, 
                  scale: 0.8 
                }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <div 
                  className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border-2"
                  style={{
                    background: `${oldConfig.gradient}40`,
                    borderColor: oldConfig.color,
                    boxShadow: `0 0 20px ${oldConfig.glow}`,
                  }}
                >
                  <span className="text-4xl">{oldConfig.emoji}</span>
                  <span 
                    className="text-xs font-medium text-center px-2"
                    style={{ color: oldConfig.textColor }}
                  >
                    {oldTier}
                  </span>
                </div>
              </motion.div>

              {/* Arrow */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                <motion.div
                  animate={{ 
                    x: [0, 10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <TrendingUp 
                    className="h-12 w-12" 
                    style={{ 
                      color: newConfig.color,
                      filter: `drop-shadow(0 0 8px ${newConfig.glow})`,
                    }} 
                  />
                </motion.div>
              </motion.div>

              {/* New Tier (Right) */}
              <motion.div
                className="absolute right-[5%] top-1/2 -translate-y-1/2"
                initial={{ x: 50, opacity: 0, scale: 0.8 }}
                animate={{ 
                  x: 0, 
                  opacity: 1, 
                  scale: 1 
                }}
                transition={{ 
                  delay: 1.4, 
                  duration: 0.6,
                  type: 'spring',
                  stiffness: 200,
                }}
              >
                <motion.div 
                  className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border-2"
                  style={{
                    background: newConfig.gradient,
                    borderColor: newConfig.color,
                    boxShadow: `0 0 40px ${newConfig.glow}`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 40px ${newConfig.glow}`,
                      `0 0 60px ${newConfig.glow}`,
                      `0 0 40px ${newConfig.glow}`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <motion.span 
                    className="text-4xl"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {newConfig.emoji}
                  </motion.span>
                  <span 
                    className="text-xs font-bold text-center px-2 text-white"
                    style={{ 
                      textShadow: `0 0 10px ${newConfig.glow}`,
                    }}
                  >
                    {newTier}
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* New Score Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="text-center mb-8"
            >
              <div 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
                style={{
                  background: `${newConfig.gradient}20`,
                  border: `2px solid ${newConfig.color}`,
                  boxShadow: `0 0 30px ${newConfig.glow}`,
                }}
              >
                <Star 
                  className="h-6 w-6" 
                  style={{ color: newConfig.color }}
                />
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">New Credit Score</div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ 
                      color: newConfig.textColor,
                      textShadow: `0 0 10px ${newConfig.glow}`,
                    }}
                  >
                    {newScore}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                onClick={handleViewTier}
                size="lg"
                className="relative overflow-hidden group"
                style={{
                  background: newConfig.gradient,
                  border: 'none',
                  boxShadow: `0 0 30px ${newConfig.glow}`,
                }}
              >
                <motion.span
                  className="relative z-10 flex items-center gap-2 text-white font-semibold"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="h-5 w-5" />
                  View My New Tier
                </motion.span>
              </Button>

              <Button
                onClick={onClose}
                size="lg"
                variant="outline"
                className="border-gray-600 hover:bg-gray-800 text-gray-300"
              >
                Close
              </Button>
            </motion.div>

            {/* Bottom Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              className="text-center mt-6"
            >
              <p className="text-sm text-gray-400">
                Keep up the great work and continue building your reputation! 🚀
              </p>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
