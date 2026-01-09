import React from "react";
import {
  Star,
  Coins,
  Plus,
  Crown,
  GraduationCap,
} from "lucide-react";
import { UsernameWithGlow } from './UsernameWithGlow';
import { motion } from "motion/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { getCollegeFrameStyles } from "./CollegeFrameBackground";

interface UserProfileHeaderProps {
  currentUser: any;
  isDarkMode?: boolean;
  currentIskoins: number;
  userStats: {
    rating: number;
    totalRatings: number;
  };
  onCreditScoreClick: () => void;
  onIskoinClick: () => void;
}

export function UserProfileHeader({
  currentUser,
  isDarkMode = false,
  currentIskoins,
  userStats,
  onCreditScoreClick,
  onIskoinClick,
}: UserProfileHeaderProps) {
  const frameStyles = getCollegeFrameStyles(
    currentUser?.frameEffect,
    isDarkMode,
  );
  const score = currentUser?.creditScore || 70;

  // Credit Score Ring Styling
  const getCreditScoreRingStyles = (score: number) => {
    if (score === 100) {
      return {
        color: "#00C6FF",
        label: "Elite Isko",
        emoji: "👑",
        gradient:
          "linear-gradient(135deg, #00C6FF 0%, #0084FF 100%)",
        glowColor: "rgba(0, 198, 255, 0.6)",
        borderColor: "#00C6FF",
        bgGradient: "from-cyan-400/90 to-blue-500/90",
        textColor: "text-cyan-700 dark:text-cyan-300",
      };
    } else if (score >= 90) {
      return {
        color: "#FFD700",
        label: "Trusted Isko",
        emoji: "🌟",
        gradient:
          "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        glowColor: "rgba(255, 215, 0, 0.6)",
        borderColor: "#FFD700",
        bgGradient: "from-yellow-400/90 to-orange-500/90",
        textColor: "text-yellow-700 dark:text-yellow-300",
      };
    } else if (score >= 80) {
      return {
        color: "#A9D4C9",
        label: "Reliable Isko",
        emoji: "🪙",
        gradient:
          "linear-gradient(135deg, #A9D4C9 0%, #5EEAD4 100%)",
        glowColor: "rgba(169, 212, 201, 0.6)",
        borderColor: "#5EEAD4",
        bgGradient: "from-teal-300/90 to-emerald-400/90",
        textColor: "text-teal-700 dark:text-teal-300",
      };
    } else if (score >= 70) {
      return {
        color: "#F5C542",
        label: "Active Isko",
        emoji: "✴️",
        gradient:
          "linear-gradient(135deg, #F5C542 0%, #FBBF24 100%)",
        glowColor: "rgba(245, 197, 66, 0.6)",
        borderColor: "#F5C542",
        bgGradient: "from-yellow-300/90 to-yellow-500/90",
        textColor: "text-yellow-700 dark:text-yellow-300",
      };
    } else if (score >= 60) {
      return {
        color: "#FFA726",
        label: "Trainee Isko",
        emoji: "🍂",
        gradient:
          "linear-gradient(135deg, #FFA726 0%, #FF6F00 100%)",
        glowColor: "rgba(255, 167, 38, 0.6)",
        borderColor: "#FFA726",
        bgGradient: "from-orange-300/90 to-orange-500/90",
        textColor: "text-orange-700 dark:text-orange-300",
      };
    } else {
      return {
        color: "#EF5350",
        label: "Unranked Isko",
        emoji: "🕊",
        gradient:
          "linear-gradient(135deg, #EF5350 0%, #C62828 100%)",
        glowColor: "rgba(239, 83, 80, 0.6)",
        borderColor: "#EF5350",
        bgGradient: "from-red-400/90 to-red-600/90",
        textColor: "text-red-700 dark:text-red-300",
      };
    }
  };

  const ringStyles = getCreditScoreRingStyles(score);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative w-full">
      {/* Background Profile Container - VISIBLE College Frame Badge Background (Cover Photo Style) */}
      <div
        className="relative w-full h-[240px] rounded-[32px] overflow-visible p-6 transition-all duration-300"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(0, 26, 18, 0.85) 0%, rgba(0, 36, 24, 0.90) 50%, rgba(0, 26, 18, 0.85) 100%)'
            : frameStyles?.bg || 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
          backdropFilter: isDarkMode ? 'blur(20px) saturate(180%)' : 'none',
          border: '1px solid',
          borderColor: isDarkMode
            ? 'rgba(20, 184, 166, 0.15)'
            : frameStyles?.border || 'rgba(134, 239, 172, 0.3)',
          boxShadow: isDarkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(20, 184, 166, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 0 80px rgba(20, 184, 166, 0.03)'
            : (frameStyles as any)?.shadow || '0 2px 8px rgba(0, 100, 0, 0.08), 0 4px 12px rgba(0, 150, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 0 60px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Subtle gradient overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[32px]"
          style={{
            background: isDarkMode
              ? "radial-gradient(circle at top right, rgba(20, 184, 166, 0.12) 0%, transparent 60%)"
              : "radial-gradient(circle at top right, rgba(255, 255, 255, 0.4) 0%, transparent 60%)",
          }}
        />

        {/* Profile Frame Section Container - VISIBLE Glassmorphic Card */}
        <div
          className="relative w-full h-full rounded-[28px] backdrop-blur-[16px] border transition-all duration-300 overflow-visible"
          style={{
            background: isDarkMode 
              ? 'rgba(17, 24, 39, 0.65)' 
              : 'rgba(255, 255, 255, 0.75)',
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.06)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Iskoins Button - Top Right of Profile Frame */}
          <div className="absolute top-5 right-5 z-20">
            <motion.button
              onClick={onIskoinClick}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.96 }}
              className="px-4 py-2 rounded-[18px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              style={{
                boxShadow:
                  "0 4px 16px rgba(251, 191, 36, 0.4), 0 2px 6px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
              }}
              title="Spin to earn more Iskoins"
            >
              <Plus className="h-3.5 w-3.5" />
              <Coins className="h-3.5 w-3.5" />
              <span className="text-[14px] font-semibold">
                {currentIskoins} Iskoins
              </span>
            </motion.button>
          </div>

          {/* Profile Content - Centered Vertically */}
          <div 
            className="relative px-6 py-6 h-full flex items-center rounded-[24px] transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 dark:shadow-[0_0_20px_rgba(20,184,166,0.1)] backdrop-blur-sm"
          >
            <div className="flex items-center gap-5 w-full">
              {/* Avatar with Integrated Premium Credit Score Ring - Fixed Clipping */}
              <div
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={onCreditScoreClick}
                title="View credit score history"
                style={{
                  // Add extra padding to prevent ring clipping
                  padding: '8px',
                }}
              >
                <div className="relative transition-transform duration-300 group-hover:scale-[1.03]">
                  {/* Premium SVG Ring with Glossy Effect - Fixed Size */}
                  <svg
                    className="absolute w-[128px] h-[128px]"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: "translate(-50%, -50%) rotate(-90deg)",
                      filter: `drop-shadow(0 0 12px ${ringStyles.glowColor}) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12))`,
                    }}
                    viewBox="0 0 128 128"
                  >
                    {/* Background Circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.04)"
                      strokeWidth="5"
                      className="dark:stroke-white/8"
                    />
                    {/* Progress Circle with Gradient */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="none"
                      stroke={ringStyles.borderColor}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{
                        strokeDashoffset: circumference - progress,
                      }}
                      transition={{
                        duration: 1.8,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                      style={{
                        filter: `drop-shadow(0 0 10px ${ringStyles.glowColor})`,
                      }}
                    />
                  </svg>

                  {/* Avatar with Premium Depth */}
                  <div
                    className="relative z-10"
                    style={{
                      filter:
                        "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.18))",
                    }}
                  >
                    <Avatar className="h-24 w-24 border-[5px] border-white dark:border-[#001512] shadow-inner">
                      <AvatarImage
                        src={currentUser?.avatar || ""}
                        alt={currentUser?.name || "User"}
                      />
                      <AvatarFallback
                        className="text-2xl font-semibold"
                        style={{
                          background: ringStyles.gradient,
                          color: "white",
                        }}
                      >
                        {(currentUser?.name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Premium Score Badge */}
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[13px] font-bold shadow-lg whitespace-nowrap z-20 border-2 border-white dark:border-[#001512]"
                    style={{
                      background: ringStyles.gradient,
                      color: "white",
                      boxShadow: `0 3px 12px ${ringStyles.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.4)`,
                    }}
                  >
                    {score}
                  </div>
                </div>
              </div>

              {/* Profile Information - Premium Social Media Style */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Username - Large & Bold (Premium) */}
                <div className="space-y-0.5">
                  <h1 className="text-[34px] leading-[1.1] font-bold text-[#1a1a1a] dark:text-white tracking-[-0.02em]">
                    <UsernameWithGlow 
                      username={currentUser?.username || currentUser?.name || 'User'}
                      glowEffect={currentUser?.glowEffect}
                      showTimer={true}
                      currentUserId={currentUser?.id}
                      ownerId={currentUser?.id}
                      className="text-[34px] leading-[1.1] font-bold"
                      showAtSign={false}
                    />
                  </h1>



                  {/* Email - Muted & Clean */}
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                    {currentUser?.email}
                  </p>
                </div>

                {/* Premium Badge Row - Instagram/LinkedIn Style */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Elite Isko Badge - Premium Gradient */}
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold shadow-sm border border-white/40"
                    style={{
                      background: ringStyles.gradient,
                      color: "white",
                      boxShadow: `0 1px 4px ${ringStyles.glowColor}`,
                    }}
                  >
                    <span className="text-[14px]">
                      {ringStyles.emoji}
                    </span>
                    <span>{ringStyles.label}</span>
                  </div>

                  {/* Trustworthy Badge - Clean Green */}
                  {score >= 80 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[12px] font-semibold shadow-sm border border-white/40">
                      <span className="text-[14px]">✓</span>
                      <span>Trustworthy</span>
                    </div>
                  )}

                  {/* Rating - Amber Pill with Star */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[12px] font-semibold shadow-sm border border-white/40">
                    <Star className="h-3 w-3 fill-white" />
                    <span>{userStats.rating}</span>
                    <span className="opacity-80">
                      ({userStats.totalRatings} reviews)
                    </span>
                  </div>

                  {/* Role Badge - Premium with Icon */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 text-[12px] font-semibold shadow-sm border border-gray-300/40 dark:border-gray-600/40">
                    {currentUser?.isAdmin ? (
                      <>
                        <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                        <span>Admin</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span>Student</span>
                      </>
                    )}
                  </div>

                  {/* Program Badge (if available) */}
                  {currentUser?.program && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--surface-soft)] dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-[12px] font-medium border border-gray-200/60 dark:border-gray-700/60">
                      {currentUser.program}
                    </div>
                  )}
                </div>

                {/* Bio - Only if Available */}
                {currentUser?.bio && (
                  <div className="pt-2.5 border-t border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                      {currentUser.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}