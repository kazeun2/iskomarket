import React, { useState, useEffect } from "react";
import { X, Trophy, Sparkles, Coins, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import iskoMarketLogo from "figma:asset/3b968d3684aca43d11e97d92782eb8bb2dea6d18.png";

interface DailySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIskoins: number;
  onSpinComplete: (iskoins: number) => void;
  availableSpins?: number;
  userCreditScore: number;
}

const SPIN_PRIZES = [
  { value: 0, label: "0", color: "#9CA3AF", weight: 20 }, // Gray
  { value: 1, label: "1", color: "#A9D4C9", weight: 25 }, // Mint
  { value: 2, label: "2", color: "#F5C542", weight: 20 }, // Light Yellow
  { value: 3, label: "3", color: "#F8961E", weight: 15 }, // Pale Orange
  { value: 4, label: "4", color: "#FFD700", weight: 10 }, // Gold
  { value: 5, label: "5", color: "#DAA520", weight: 6 }, // Deep Gold
  { value: 6, label: "6", color: "#E91E63", weight: 3 }, // Rose-Gold
  { value: 7, label: "7", color: "#00C6FF", weight: 1 }, // Diamond Blue
];

export function DailySpinModal({
  isOpen,
  onClose,
  currentIskoins,
  onSpinComplete,
  userCreditScore,
}: DailySpinModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(1);
  const [rechargesLeft, setRechargesLeft] = useState(3);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isElite = userCreditScore === 100;

  useEffect(() => {
    // Check if user has already spun today
    const lastSpinDate = localStorage.getItem(
      "lastDailySpinDate",
    );
    const today = new Date().toDateString();

    if (lastSpinDate === today) {
      setHasSpunToday(true);
      setSpinsLeft(0);
    } else {
      setHasSpunToday(false);
      setSpinsLeft(1);
      setRechargesLeft(3);
    }
  }, [isOpen]);

  const getRandomPrize = () => {
    const totalWeight = SPIN_PRIZES.reduce(
      (sum, prize) => sum + prize.weight,
      0,
    );
    let random = Math.random() * totalWeight;

    for (const prize of SPIN_PRIZES) {
      random -= prize.weight;
      if (random <= 0) {
        return prize;
      }
    }

    return SPIN_PRIZES[0];
  };

  const handleSpin = () => {
    if (isSpinning || spinsLeft === 0) return;

    setIsSpinning(true);
    setResult(null);

    const prize = getRandomPrize();
    const prizeIndex = SPIN_PRIZES.findIndex(
      (p) => p.value === prize.value,
    );
    const degreesPerSlice = 360 / SPIN_PRIZES.length;
    const targetRotation =
      360 * 5 +
      prizeIndex * degreesPerSlice +
      degreesPerSlice / 2;

    setRotation(targetRotation);

    setTimeout(() => {
      setResult(prize.value);
      setIsSpinning(false);
      setSpinsLeft((prev) => prev - 1);

      if (prize.value > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      onSpinComplete(prize.value);

      // Save last spin date
      if (spinsLeft === 1 && rechargesLeft === 3) {
        localStorage.setItem(
          "lastDailySpinDate",
          new Date().toDateString(),
        );
      }

      toast.success(
        `You won ${prize.value} Iskoin${prize.value !== 1 ? "s" : ""}!`,
        {
          description:
            prize.value === 7
              ? "🎉 JACKPOT! Diamond reward!"
              : prize.value >= 4
                ? "✨ Great spin!"
                : undefined,
          duration: 4000,
        },
      );
    }, 3000);
  };

  const handleRecharge = () => {
    if (rechargesLeft === 0 || currentIskoins < 2) return;

    setSpinsLeft((prev) => prev + 1);
    setRechargesLeft((prev) => prev - 1);
    onSpinComplete(-2); // Deduct 2 Iskoins
    toast.info("Spin recharged! (-2 Iskoins)", {
      duration: 2000,
    });
  };

  if (!isElite) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="modal-standard !w-[500px]">
          <DialogDescription className="sr-only">
            Elite members only feature for daily spin rewards
          </DialogDescription>
          <div className="modal-header-standard relative">
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Daily Spin - Elite Only
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="modal-close-button-standard h-6 w-6 rounded-full"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="modal-content-standard !max-h-[300px]">
            <div className="text-center space-y-4 py-8">
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center opacity-20">
                <Trophy className="h-10 w-10 text-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-lg">
                  This feature is exclusive to Elite Isko
                  Members
                </p>
                <p className="text-sm text-muted-foreground">
                  Reach 100 credit score to unlock the Daily
                  Spin and earn bonus Iskoins!
                </p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-sm">
                  <strong>Your Credit Score:</strong>{" "}
                  {userCreditScore}/100
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - userCreditScore} points to Elite status
                </p>
              </div>
            </div>
          </div>

          <div className="modal-footer-standard">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-standard !w-[650px] !max-h-[90vh] !p-0 dark:!bg-gradient-to-br dark:!from-[#003726]/95 dark:!via-[#004d3d]/90 dark:!to-[#002818]/95 dark:!backdrop-blur-xl dark:!border-[#14b8a6]/30">
        <DialogDescription className="sr-only">
          Spin the wheel daily to earn Iskoins and bonus rewards
        </DialogDescription>
        
        {/* Header with glassmorphic dark mode */}
        <div className="modal-header-standard relative bg-[var(--card)] dark:!bg-gradient-to-br dark:!from-[#003726]/80 dark:!via-[#004d3d]/70 dark:!to-[#002818]/80 backdrop-blur-xl !border-b !border-gray-200/50 dark:!border-[#14b8a6]/20">
          <DialogTitle className="flex items-center gap-3 text-left w-full">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Trophy className="h-5 w-5 text-foreground" />
            </div>
            <span className="flex-1 text-gray-900 dark:text-foreground">Daily Spin for Iskoins</span>
            
            {/* Live Iskoin Balance Badge */}
            <motion.div
              key={currentIskoins}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-foreground text-sm font-medium shadow-lg ml-auto mr-2"
            >
              <Coins className="h-3 w-3 inline mr-1" />
              {currentIskoins} Iskoins
            </motion.div>
          </DialogTitle>

          <Button
            variant="ghost"
            size="icon"
            className="modal-close-button-standard h-6 w-6 rounded-full !text-gray-700 dark:!text-gray-300"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content with glassmorphic dark mode */}
        <div className="modal-content-standard !max-h-[calc(90vh-80px)] bg-[var(--card)] dark:!bg-transparent">
          <div className="space-y-6 py-4">
            {/* Confetti Effect */}
            <AnimatePresence>
              {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        y: 0,
                        x: 0,
                        opacity: 1,
                        rotate: 0,
                      }}
                      animate={{
                        y: [0, -200, -400],
                        x: [
                          (Math.random() - 0.5) * 100,
                          (Math.random() - 0.5) * 300,
                        ],
                        opacity: [1, 1, 0],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.03,
                        ease: "easeOut",
                      }}
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        background: [
                          "#FFD700",
                          "#00C6FF",
                          "#FF6B9D",
                          "#4ECDC4",
                          "#95E1D3",
                        ][i % 5],
                      }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* 3D Spin Wheel Container */}
            <div className="relative mx-auto" style={{ width: "340px", height: "340px" }}>
              {/* Animated Glow Ring */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(16, 185, 129, 0.4)",
                    "0 0 50px rgba(16, 185, 129, 0.6)",
                    "0 0 30px rgba(16, 185, 129, 0.4)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full"
              />

              {/* Metallic Glossy Pointer/Indicator */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 -mt-1">
                <div 
                  className="relative"
                  style={{
                    filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))"
                  }}
                >
                  <svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
                      </linearGradient>
                    </defs>
                    <path d="M20 0 L40 40 L20 36 L0 40 Z" fill="url(#metalGradient)" />
                    <path d="M20 0 L40 40 L20 36 L0 40 Z" fill="url(#gloss)" opacity="0.5" />
                    <path d="M20 2 L36 38 L20 34 L4 38 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                  </svg>
                </div>
              </div>

              {/* 3D Wheel Container with Enhanced Depth */}
              <div 
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  boxShadow: `
                    0 25px 70px rgba(0, 0, 0, 0.35),
                    0 10px 30px rgba(0, 0, 0, 0.25),
                    inset 0 3px 8px rgba(255, 255, 255, 0.15),
                    inset 0 -3px 8px rgba(0, 0, 0, 0.25),
                    0 0 0 1px rgba(0, 0, 0, 0.1)
                  `,
                  transform: "perspective(1200px) rotateX(8deg)",
                  transformStyle: "preserve-3d"
                }}
              >
                {/* Spinning wheel - FIXED: Added proper rotation state */}
                <motion.div
                  animate={{ rotate: rotation }}
                  transition={{
                    duration: 3,
                    ease: [0.25, 0.1, 0.25, 1], // Custom easing for deceleration
                  }}
                  className="relative w-full h-full"
                  style={{
                    transformStyle: "preserve-3d",
                    willChange: "transform"
                  }}
                >
                  {/* Spinning indicator overlay */}
                  {isSpinning && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 animate-pulse z-10 pointer-events-none" />
                  )}
                  
                  {SPIN_PRIZES.map((prize, index) => {
                    const segmentRotation = (360 / SPIN_PRIZES.length) * index;
                    return (
                      <div
                        key={index}
                        className="absolute inset-0"
                        style={{
                          transform: `rotate(${segmentRotation}deg)`,
                          transformOrigin: "center",
                        }}
                      >
                        <div
                          className="absolute left-1/2 top-0 w-1/2 h-1/2 origin-bottom-left flex items-start justify-end pr-10 pt-6"
                          style={{
                            background: `linear-gradient(135deg, ${prize.color} 0%, ${prize.color}ee 50%, ${prize.color}dd 100%)`,
                            clipPath: `polygon(0 0, 100% 0, 50% 100%)`,
                            transform: `rotate(${360 / SPIN_PRIZES.length / 2}deg)`,
                            boxShadow: `
                              inset -2px -2px 4px rgba(0, 0, 0, 0.3),
                              inset 2px 2px 4px rgba(255, 255, 255, 0.4),
                              inset 0 0 20px rgba(255, 255, 255, 0.1)
                            `,
                            borderRight: "1.5px solid rgba(255, 255, 255, 0.3)",
                            borderLeft: "0.5px solid rgba(0, 0, 0, 0.2)"
                          }}
                        >
                          <span 
                            className="text-foreground text-2xl font-bold"
                            style={{
                              textShadow: `
                                0 3px 10px rgba(0, 0, 0, 0.5),
                                0 0 5px rgba(255, 255, 255, 0.4),
                                0 1px 3px rgba(0, 0, 0, 0.8)
                              `,
                              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))"
                            }}
                          >
                            {prize.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>

                {/* 3D Center Circle with Enhanced Glow */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center z-20"
                  style={{
                    boxShadow: `
                      0 10px 30px rgba(0, 0, 0, 0.4),
                      inset 0 3px 8px rgba(255, 255, 255, 0.6),
                      inset 0 -3px 8px rgba(0, 0, 0, 0.3),
                      0 0 0 3px rgba(255, 255, 255, 0.2)
                    `,
                    transform: "translateZ(30px)"
                  }}
                >
                  <motion.div 
                    className="w-22 h-22 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 dark:from-emerald-500 dark:via-green-500 dark:to-green-700 flex items-center justify-center relative overflow-hidden"
                    animate={isSpinning ? {
                      boxShadow: [
                        "inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(16, 185, 129, 0.5)",
                        "inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(16, 185, 129, 0.7)",
                        "inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(16, 185, 129, 0.5)",
                      ]
                    } : {
                      boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(16, 185, 129, 0.5)"
                    }}
                    transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0 }}
                    style={{
                      width: "88px",
                      height: "88px"
                    }}
                  >
                    {/* Glossy highlight */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-sm" />
                    
                    <motion.div
                      animate={isSpinning ? { rotate: 360 } : {}}
                      transition={{ duration: 2, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
                      className="relative z-10"
                    >
                      <img 
                        src={iskoMarketLogo} 
                        alt="IskoMarket" 
                        className="h-12 w-12 object-contain drop-shadow-lg"
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Result Display */}
            <AnimatePresence>
              {result !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="text-center space-y-2 py-2"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                    +{result} Iskoin{result !== 1 ? "s" : ""}{" "}
                    earned!
                  </div>
                  {result === 7 && (
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-foreground border-0 text-lg px-4 py-1">
                      🎉 JACKPOT!
                    </Badge>
                  )}
                  {result >= 4 && result < 7 && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-foreground border-0">
                      ✨ Great Spin!
                    </Badge>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spin Info Section - MOVED BELOW WHEEL, ABOVE BUTTON */}
            <div className="grid grid-cols-2 gap-4 px-4">
              <div 
                className="bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[16px] p-4 backdrop-blur-sm"
                style={{
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(20, 184, 166, 0.1)"
                }}
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Free Spins Left
                </div>
                <div className="flex items-center justify-between">
                  <motion.span 
                    key={spinsLeft}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    {spinsLeft}
                  </motion.span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/1</span>
                </div>
              </div>

              <div 
                className="bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[16px] p-4 backdrop-blur-sm"
                style={{
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(20, 184, 166, 0.1)"
                }}
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Recharges Available
                </div>
                <div className="flex items-center justify-between">
                  <motion.span 
                    key={rechargesLeft}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-amber-600 dark:text-amber-400"
                  >
                    {rechargesLeft}
                  </motion.span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/3</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - DIRECTLY BELOW COUNTERS */}
            <div className="px-4 space-y-3">
              <Button
                onClick={handleSpin}
                disabled={isSpinning || spinsLeft === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-foreground rounded-[16px] h-12 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.4)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isSpinning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mr-2"
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                    Spinning...
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5 mr-2" />
                    {spinsLeft > 0
                      ? "Spin Now (Free)"
                      : "No Spins Left"}
                  </>
                )}
              </Button>

              {spinsLeft === 0 && rechargesLeft > 0 && (
                <Button
                  onClick={handleRecharge}
                  disabled={currentIskoins < 2}
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-amber-500/50 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-[16px] h-12 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Coins className="h-5 w-5 mr-2" />
                  Recharge + Spin (2 Iskoins)
                </Button>
              )}

              {rechargesLeft === 0 && spinsLeft === 0 && (
                <div className="w-full bg-gray-100 dark:bg-gray-800/50 rounded-[16px] p-4 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Limit reached. Try again tomorrow!
                  </p>
                </div>
              )}
            </div>

            {/* Prize Distribution Section - Improved Layout */}
            <div 
              className="bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-[16px] p-5 border border-emerald-200/50 dark:border-emerald-500/20 mx-4"
              style={{
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)"
              }}
            >
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-4">
                Prize Distribution
              </p>
              <div className="grid grid-cols-4 gap-3">
                {SPIN_PRIZES.map((prize) => (
                  <div
                    key={prize.value}
                    className="text-center"
                  >
                    <div
                      className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center text-foreground font-bold shadow-lg"
                      style={{ 
                        backgroundColor: prize.color,
                        boxShadow: `0 4px 12px ${prize.color}40, inset 0 1px 2px rgba(255, 255, 255, 0.3)`
                      }}
                    >
                      {prize.label}
                    </div>
                    <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      {prize.value === 7
                        ? "Jackpot"
                        : prize.value >= 5
                          ? "Rare"
                          : prize.value >= 3
                            ? "Common"
                            : "Daily"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Spin Info */}
            <div className="text-center pb-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Spin daily to earn rewards. 1 free spin per day.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
