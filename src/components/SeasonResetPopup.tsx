import React from "react";
import {
  Trophy,
  Sparkles,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { motion } from "motion/react";

interface SeasonResetPopupProps {
  isOpen: boolean;
  onClose: () => void;
  previousScore: number;
  newScore: number;
  season: string;
  iskoinsLocked: boolean;
  totalIskoins: number;
  previousSeasonBadge?: string;
  topPerformers?: any[];
  onViewLeaderboard?: () => void;
  onViewSeasonStats?: () => void;
}

export function SeasonResetPopup({
  isOpen,
  onClose,
  season,
  onViewSeasonStats,
}: SeasonResetPopupProps) {
  const handleGotIt = () => {
    // Mark as acknowledged in localStorage
    localStorage.setItem("seasonResetAcknowledged", season);
    onClose();
  };

  // View stats / leaderboard navigation removed — keep popup behavior focused on acknowledgment only.

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="modal-standard max-w-2xl p-0 overflow-hidden border-0 bg-[var(--card)] shadow-none"
          aria-describedby="season-welcome-description"
        >
          <DialogTitle className="sr-only">
            Welcome to Season 1
          </DialogTitle>
          <DialogDescription
            id="season-welcome-description"
            className="sr-only"
          >
            Welcome to IskoMarket Season 1. Your marketplace journey begins now with a starting credit score of 70.
          </DialogDescription>

          {/* Outer Modal Container - Deep Shadows & Vignette */}
          <div 
            className="relative rounded-[24px] overflow-hidden"
            style={{
              backdropFilter: 'blur(20px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 10px 24px rgba(0,0,0,0.15), 0 20px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* Dark Mode Background */}
            <div 
              className="absolute inset-0 dark:opacity-100 opacity-0"
              style={{
                background: 'linear-gradient(180deg, rgba(12, 37, 27, 0.95) 0%, rgba(9, 32, 23, 0.95) 100%)',
              }}
            />
            {/* Light Mode Background */}
            <div 
              className="absolute inset-0 dark:opacity-0 opacity-100"
              style={{
                background: 'linear-gradient(180deg, rgba(245, 250, 247, 0.98) 0%, rgba(240, 248, 243, 0.98) 100%)',
              }}
            />
            
            {/* Noise Texture Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none dark:opacity-[0.03] opacity-[0.02]"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                mixBlendMode: 'overlay',
              }}
            />

            {/* Chromatic Vignette */}
            <div 
              className="absolute inset-0 pointer-events-none dark:opacity-[0.30] opacity-[0.12]"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.6) 100%)',
              }}
            />

            <div className="relative z-10">
              {/* 1. FULL-BLEED SPLIT GRADIENT HERO (TOP) */}
              <div className="relative h-[200px] overflow-hidden">
                {/* Dark Mode Gradient */}
                <div 
                  className="absolute inset-0 dark:opacity-100 opacity-0"
                  style={{
                    background: 'linear-gradient(180deg, #0C251B 0%, #092017 100%)',
                  }}
                />
                {/* Light Mode Gradient */}
                <div 
                  className="absolute inset-0 dark:opacity-0 opacity-100"
                  style={{
                    background: 'linear-gradient(180deg, #19D77C 0%, #0FA85A 100%)',
                  }}
                />

                {/* Floating Particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full dark:bg-[var(--card)] bg-white/18"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.1, 0.18, 0.1],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}

                {/* Thin Neon Arc Line (HUD Style) */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 160, 0.6) 50%, transparent 100%)',
                    boxShadow: '0 0 8px rgba(0, 255, 160, 0.4)',
                  }}
                />

                {/* Floating Neon-Emerald Glass Orb with Trophy */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  <div 
                    className="relative w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(0, 255, 160, 0.08)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid rgba(0, 255, 160, 0.25)',
                      boxShadow: '0 0 22px rgba(0, 255, 160, 0.45), inset 0 0 20px rgba(0, 255, 160, 0.1)',
                    }}
                  >
                    <Trophy className="h-12 w-12 dark:text-[#34FF95] text-white" />
                    
                    {/* Glow Ring Animation */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: '3px solid rgba(0, 255, 160, 0.4)',
                      }}
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </motion.div>

                {/* Celebratory Confetti */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`confetti-${i}`}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: '20%',
                      background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFA07A'][i % 5],
                    }}
                    animate={{
                      y: [0, 100],
                      x: [0, (Math.random() - 0.5) * 50],
                      rotate: [0, 360],
                      opacity: [1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>

              {/* Inner Card - Raised Glass Card */}
              <div 
                className="relative mx-6 -mt-8 mb-6 rounded-[20px] overflow-hidden"
                style={{
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Dark Mode Inner Card */}
                <div 
                  className="absolute inset-0 dark:opacity-100 opacity-0"
                  style={{
                    background: 'rgba(0, 20, 15, 0.60)',
                    border: '1.5px solid rgba(0, 255, 150, 0.25)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  }}
                />
                {/* Light Mode Inner Card */}
                <div 
                  className="absolute inset-0 dark:opacity-0 opacity-100"
                  style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1.5px solid rgba(0, 160, 80, 0.25)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  }}
                />

                <div className="relative z-10 p-6 space-y-5">
                  {/* Title Stack */}
                  <div className="text-center space-y-2">
                    <motion.h2
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl dark:text-[#E9FFF4] text-[#0A4D28]"
                    >
                      🎉 Welcome to Season 1!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="dark:text-[#A6D5C0] text-[#3C7F55]"
                    >
                      Your marketplace journey begins now.
                    </motion.p>
                  </div>

                  {/* Starting Credit Score Message */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative rounded-[16px] p-5 overflow-hidden"
                    style={{
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    {/* Dark Mode Card */}
                    <div 
                      className="absolute inset-0 dark:opacity-100 opacity-0"
                      style={{
                        background: 'rgba(0, 15, 10, 0.40)',
                        border: '1px solid rgba(0, 255, 150, 0.18)',
                      }}
                    />
                    {/* Light Mode Card */}
                    <div 
                      className="absolute inset-0 dark:opacity-0 opacity-100"
                      style={{
                        background: 'rgba(255, 255, 255, 0.60)',
                        border: '1px solid rgba(0, 160, 80, 0.18)',
                      }}
                    />

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 dark:text-[#34FF95] text-[#0FA85A]" />
                        <span className="font-medium dark:text-[#C7FFD9] text-[#0A4D28]">
                          Starting Credit Score
                        </span>
                      </div>

                      <div className="text-center">
                        <div 
                          className="text-5xl font-medium dark:text-[#34FF95] text-[#0FA85A] mb-2"
                          style={{
                            textShadow: '0 0 12px rgba(52, 255, 149, 0.4)',
                          }}
                        >
                          70
                        </div>
                        <p className="text-sm leading-relaxed dark:text-[#C7FFD9] text-[#064B2C]">
                          All new users begin with a starting credit score of <strong className="dark:text-[#34FF95] text-[#0FA85A]">70</strong> to ensure a fair and balanced marketplace experience.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* PREMIUM BUTTONS */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2"
                  >
                    {/* Primary Button - Pill Shape with Emerald Gradient */}
                    <button
                      onClick={handleGotIt}
                      className="relative px-8 py-3 rounded-full overflow-hidden group transition-all duration-160"
                      style={{
                        background: 'linear-gradient(135deg, #0FBF66 0%, #0A8A4A 100%)',
                        boxShadow: '0 0 20px rgba(15, 191, 102, 0.35)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 0 28px rgba(15, 191, 102, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(15, 191, 102, 0.35)';
                      }}
                    >
                      <span className="relative z-10 text-white font-medium">
                        Got it!
                      </span>
                    </button>


                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Calculate new credit score based on season reset formula
 */
export function calculateSeasonResetScore(
  previousScore: number,
): number {
  if (previousScore === 100) return 89;
  if (previousScore === 90) return 79;
  if (previousScore >= 70 && previousScore <= 89) return 70;
  // 69 and below retain current points
  return previousScore;
}

/**
 * Check if user needs to see the season reset popup
 */
export function shouldShowSeasonResetPopup(
  currentSeason: string,
): boolean {
  const acknowledgedSeason = localStorage.getItem(
    "seasonResetAcknowledged",
  );
  return acknowledgedSeason !== currentSeason;
}

/**
 * Get current season identifier based on date
 */
export function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Seasons:
  // December - May: Season 1 (ends May 31)
  // June - November: Season 2 (ends November 30)

  if (month >= 0 && month <= 4) {
    // January - May
    return `Season 1 ${year}`;
  } else if (month === 5) {
    // June - could be transition
    const day = now.getDate();
    if (day === 1) {
      return `Season 2 ${year}`;
    }
    return `Season 1 ${year}`;
  } else if (month >= 6 && month <= 10) {
    // July - November
    return `Season 2 ${year}`;
  } else {
    // December
    const day = now.getDate();
    if (day === 1) {
      return `Season 1 ${year + 1}`;
    }
    return `Season 2 ${year}`;
  }
}
