import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

interface ProfileAvatarWithScoreProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  creditScore: number
  className?: string
  showRing?: boolean
  showAnimation?: boolean
}

export function ProfileAvatarWithScore({
  src,
  alt,
  size = 'md',
  creditScore,
  className = '',
  showRing = true,
  showAnimation = true
}: ProfileAvatarWithScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  // Animate score on mount and when score changes
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimatedScore(creditScore)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setAnimatedScore(creditScore)
    }
  }, [creditScore, showAnimation])

  // Size configurations - Adjusted for more visible ring
  const sizeConfig = {
    sm: {
      container: 'w-14 h-14',
      avatar: 'w-9 h-9',
      stroke: 2.5,
      radius: 24
    },
    md: {
      container: 'w-20 h-20',
      avatar: 'w-13 h-13',
      stroke: 3,
      radius: 36
    },
    lg: {
      container: 'w-28 h-28',
      avatar: 'w-20 h-20',
      stroke: 3.5,
      radius: 52
    },
    xl: {
      container: 'w-36 h-36',
      avatar: 'w-[104px] h-[104px]',
      stroke: 4.5,
      radius: 68
    }
  }

  const config = sizeConfig[size]
  const circumference = 2 * Math.PI * config.radius
  const progress = (animatedScore / 100) * circumference

  // Determine color based on score
  const getScoreColor = () => {
    if (creditScore === 100) return '#06B6D4' // Cyan - Elite
    if (creditScore >= 80) return '#10B981' // Green - Trustworthy
    if (creditScore >= 70) return '#F59E0B' // Yellow - Developing
    if (creditScore >= 61) return '#F97316' // Orange - Recovering
    return '#EF4444' // Red - At Risk
  }

  const getGlowColor = () => {
    if (creditScore === 100) return 'rgba(6, 182, 212, 0.4)'
    if (creditScore >= 80) return 'rgba(16, 185, 129, 0.4)'
    if (creditScore >= 70) return 'rgba(245, 158, 11, 0.4)'
    if (creditScore >= 61) return 'rgba(249, 115, 22, 0.4)'
    return 'rgba(239, 68, 68, 0.4)'
  }

  const scoreColor = getScoreColor()
  const glowColor = getGlowColor()

  return (
    <div className={`relative inline-block ${config.container} ${className}`}>
      {/* SVG Ring */}
      {showRing && (
        <svg 
          className="absolute inset-0 transform -rotate-90" 
          width="100%" 
          height="100%"
        >
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-muted opacity-20"
          />
          
          {/* Animated progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={config.radius}
            fill="none"
            stroke={scoreColor}
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
              ease: "easeOut"
            }}
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>
      )}

      {/* Avatar Image - Centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className={`${config.avatar} rounded-full object-cover border-2 border-background`}
        />
      </div>

      {/* Pulse animation for Elite tier (100 score) */}
      {creditScore === 100 && showAnimation && showRing && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}
