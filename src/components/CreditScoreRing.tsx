import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trophy,
  TrendingUp,
} from "lucide-react";

interface CreditScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showAnimation?: boolean;
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function CreditScoreRing({
  score,
  size = "md",
  showAnimation = true,
  showIcon = true,
  showLabel = true,
  className = "",
}: CreditScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount and when score changes
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimatedScore(score);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedScore(score);
    }
  }, [score, showAnimation]);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "w-20 h-20",
      stroke: 3,
      fontSize: "text-sm",
      labelSize: "text-[8px]",
      iconSize: "h-4 w-4",
    },
    md: {
      container: "w-28 h-28",
      stroke: 4,
      fontSize: "text-xl",
      labelSize: "text-[10px]",
      iconSize: "h-5 w-5",
    },
    lg: {
      container: "w-36 h-36",
      stroke: 5,
      fontSize: "text-2xl",
      labelSize: "text-xs",
      iconSize: "h-6 w-6",
    },
    xl: {
      container: "w-44 h-44",
      stroke: 6,
      fontSize: "text-3xl",
      labelSize: "text-sm",
      iconSize: "h-8 w-8",
    },
  };

  const config = sizeConfig[size];
  const radius =
    size === "sm"
      ? 32
      : size === "md"
        ? 45
        : size === "lg"
          ? 58
          : 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  // Determine tier information based on score
  const getTierInfo = () => {
    if (score === 100) {
      return {
        color: "#00C6FF", // Diamond Blue
        emoji: "💎",
        label: "Elite Isko",
        icon: Trophy,
        gradient: "from-cyan-400 to-blue-500",
        glowColor: "rgba(0, 198, 255, 0.5)",
        innerGlow:
          "radial-gradient(circle, rgba(0, 198, 255, 0.6) 0%, transparent 70%)",
        description: "Maxed. Top credibility and privileges",
        accentDescription: "Radiant blue shimmer",
        textColor: {
          light: "#0891B2", // Rich cyan for light mode
          dark: "#C7FFF3", // Bright aqua for dark mode
        },
        textGlow: "rgba(0, 198, 255, 0.45)",
        labelSize: "14px", // Larger for Elite
      };
    } else if (score >= 90) {
      return {
        color: "#FFD700", // Gold
        emoji: "🏆",
        label: "Trusted Isko",
        icon: ShieldCheck,
        gradient: "from-yellow-400 to-yellow-600",
        glowColor: "rgba(255, 215, 0, 0.5)",
        innerGlow:
          "radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)",
        description: "Reliable participant",
        accentDescription: "Warm inner glow",
        textColor: {
          light: "#B8860B", // Rich gold for light mode
          dark: "#FFF4C7", // Bright gold for dark mode
        },
        textGlow: "rgba(255, 215, 0, 0.4)",
        labelSize: "13px",
      };
    } else if (score >= 80) {
      return {
        color: "#A9D4C9", // Mint Silver
        emoji: "✨",
        label: "Reliable Isko",
        icon: ShieldCheck,
        gradient: "from-teal-300 to-emerald-400",
        glowColor: "rgba(169, 212, 201, 0.5)",
        innerGlow:
          "radial-gradient(circle, rgba(169, 212, 201, 0.35) 0%, transparent 70%)",
        description: "Reliable participant",
        accentDescription: "Cool glow",
        textColor: {
          light: "#0D9488", // Rich teal for light mode
          dark: "#DFFFF3", // Bright mint for dark mode
        },
        textGlow: "rgba(169, 212, 201, 0.4)",
        labelSize: "13px",
      };
    } else if (score >= 70) {
      return {
        color: "#F5C542", // Gold-Yellow
        emoji: "💛",
        label: "Active Isko",
        icon: TrendingUp,
        gradient: "from-yellow-400 to-amber-500",
        glowColor: "rgba(245, 197, 66, 0.4)",
        innerGlow:
          "radial-gradient(circle, rgba(245, 197, 66, 0.3) 0%, transparent 70%)",
        description: "Active but still building trust",
        accentDescription: "Subtle shine",
        textColor: {
          light: "#D97706", // Rich amber for light mode
          dark: "#FFF8DC", // Bright yellow for dark mode
        },
        textGlow: "rgba(245, 197, 66, 0.35)",
        labelSize: "12px",
      };
    } else if (score >= 61) {
      return {
        color: "#D09455", // Bronze
        emoji: "🟠",
        label: "Trainee Isko",
        icon: Shield,
        gradient: "from-orange-400 to-amber-600",
        glowColor: "rgba(208, 148, 85, 0.4)",
        innerGlow:
          "radial-gradient(circle, rgba(208, 148, 85, 0.25) 0%, transparent 70%)",
        description: "Recovering reputation",
        accentDescription: "Light orange tint",
        textColor: {
          light: "#C2410C", // Rich orange for light mode
          dark: "#FFE4C7", // Bright bronze for dark mode
        },
        textGlow: "rgba(208, 148, 85, 0.35)",
        labelSize: "12px",
      };
    } else {
      return {
        color: "#7A0E20", // Deep Crimson
        emoji: "⚠️",
        label: "Unranked Isko",
        icon: ShieldAlert,

        // Crimson gradient (replaces gray)
        gradient: "from-[#A1162E] to-[#4A0A14]",

        // Crimson glow (replaces silver glow)
        glowColor: "rgba(174, 24, 46, 0.35)",

        // Inner crimson glow (premium fintech crimson aura)
        innerGlow:
          "radial-gradient(circle, rgba(224, 69, 89, 0.25) 0%, transparent 70%)",

        description: "Under review & limited access",

        // Updated accent description
        accentDescription: "Deep crimson inner glow",

        textColor: {
          light: "#8B1E2C", // Clean readable crimson for light mode
          dark: "#FCE8E9", // Soft warm white-crimson for dark mode
        },

        // Text glow matching the crimson palette
        textGlow: "rgba(209, 41, 58, 0.35)",

        labelSize: "12px",
      };
    }
  };

  const tierInfo = getTierInfo();
  const IconComponent = tierInfo.icon;

  return (
    <div
      className={`relative ${config.container} ${className}`}
    >
      {/* Inner glow effect */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: tierInfo.innerGlow,
          opacity: 0.6,
          filter: "blur(8px)",
        }}
      />

      <svg
        className="transform -rotate-90 relative z-10"
        width="100%"
        height="100%"
      >
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.stroke}
          className="text-muted opacity-20"
        />

        {/* Animated progress circle with enhanced glow */}
        <motion.circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke={tierInfo.color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - progress,
          }}
          transition={{
            duration: showAnimation ? 1.5 : 0,
            ease: "easeOut",
          }}
          style={{
            filter: `drop-shadow(0 0 ${score === 100 ? "12px" : "8px"} ${tierInfo.glowColor})`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        {/* Premium typography styles with noise texture */}
        <style>{`
                .credit-score-number {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
                  font-weight: 600;
                  letter-spacing: 0.25px;
                  position: relative;
                }
                
                /* Noise texture overlay for depth */
                .credit-score-number::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                  opacity: 0.04;
                  pointer-events: none;
                  mix-blend-mode: overlay;
                }
                
                .credit-score-label {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
                  font-weight: 600;
                  letter-spacing: 0.3px;
                  text-transform: none;
                  position: relative;
                }
                
                /* Noise texture for label */
                .credit-score-label::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                  opacity: 0.03;
                  pointer-events: none;
                  mix-blend-mode: overlay;
                }
              `}</style>

        {showIcon && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <IconComponent
              className={`${config.iconSize} mb-0.5`}
              style={{ color: tierInfo.color }}
            />
          </motion.div>
        )}

        {showLabel && (
          <>
            {/* Score number with premium styling */}
            <motion.div
              className={`credit-score-number ${config.fontSize}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <span
                className="dark:hidden"
                style={{
                  color: tierInfo.textColor.light,
                  textShadow: `
                          0 2px 4px rgba(0, 0, 0, 0.08),
                          0 0 8px ${tierInfo.textGlow}
                        `,
                }}
              >
                {animatedScore}
              </span>
              <span
                className="hidden dark:inline"
                style={{
                  color: tierInfo.textColor.dark,
                  textShadow: `
                          0 2px 6px rgba(0, 0, 0, 0.3),
                          0 0 10px ${tierInfo.textGlow},
                          0 0 20px ${tierInfo.textGlow}
                        `,
                }}
              >
                {animatedScore}
              </span>
            </motion.div>

            {/* Label with premium styling */}
            <motion.div
              className="credit-score-label mt-0.5"
              style={{ fontSize: tierInfo.labelSize }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <span
                className="dark:hidden"
                style={{
                  color: tierInfo.textColor.light,
                  textShadow: `
                          0 1px 3px rgba(0, 0, 0, 0.06),
                          0 0 6px ${tierInfo.textGlow}
                        `,
                }}
              >
                {tierInfo.label}
              </span>
              <span
                className="hidden dark:inline"
                style={{
                  color: tierInfo.textColor.dark,
                  textShadow: `
                          0 2px 4px rgba(0, 0, 0, 0.25),
                          0 0 8px ${tierInfo.textGlow},
                          0 0 16px ${tierInfo.textGlow}
                        `,
                }}
              >
                {tierInfo.label}
              </span>
            </motion.div>
          </>
        )}
      </div>

      {/* Pulse animation for Elite tier */}
      {score === 100 && showAnimation && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${tierInfo.glowColor} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  );
}
