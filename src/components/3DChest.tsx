import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ChestProps {
  material: 'bronze' | 'silver' | 'gold' | 'diamond';
  size?: 'small' | 'medium' | 'large';
  state?: 'idle' | 'hover' | 'opening';
  onHover?: () => void;
}

const CHEST_STYLES = {
  bronze: {
    body: 'linear-gradient(135deg, #D09455 0%, #F0C899 100%)',
    lid: '#B07B47',
    accent: '#CD7F32',
    glow: 'rgba(208, 148, 85, 0.4)',
    rimLight: '#FFD1A3'
  },
  silver: {
    body: 'linear-gradient(135deg, #C9C9C9 0%, #E8E8E8 100%)',
    lid: '#A8A8A8',
    accent: '#67B8DE',
    glow: 'rgba(169, 212, 201, 0.4)',
    rimLight: '#D6F5FF'
  },
  gold: {
    body: 'linear-gradient(135deg, #FFD700 0%, #FFF3B0 100%)',
    lid: '#DAA520',
    accent: '#FF4500',
    glow: 'rgba(255, 215, 0, 0.5)',
    rimLight: '#FFFACD'
  },
  diamond: {
    body: 'linear-gradient(135deg, #00C6FF 0%, #B1E7FF 100%)',
    lid: '#0099CC',
    accent: '#00FFFF',
    glow: 'rgba(0, 198, 255, 0.6)',
    rimLight: '#E0F7FF'
  }
};

export function Chest3D({ material, size = 'medium', state = 'idle', onHover }: ChestProps) {
  const style = CHEST_STYLES[material];
  
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} mx-auto perspective-1000`}
      onMouseEnter={onHover}
    >
      {/* Pedestal */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-3 rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
          filter: 'blur(2px)'
        }}
      />

      {/* Chest Container */}
      <motion.div
        className="relative w-full h-full"
        animate={state === 'idle' ? {
          y: [0, -4, 0]
        } : state === 'hover' ? {
          scale: [1, 1.05, 1]
        } : {}}
        transition={{
          duration: state === 'idle' ? 3 : 0.5,
          repeat: state === 'idle' ? Infinity : 0,
          ease: 'easeInOut'
        }}
        style={{
          filter: state === 'hover' ? `drop-shadow(0 0 12px ${style.glow})` : `drop-shadow(0 6px 12px rgba(0,0,0,0.25))`
        }}
      >
        {/* Chest Body */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[60%] rounded-lg"
          style={{
            background: style.body,
            boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.2), inset 4px 0 6px ${style.rimLight}`
          }}
        >
          {/* Lock Detail */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-sm"
            style={{
              background: style.lid,
              boxShadow: `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px ${style.rimLight}`
            }}
          >
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-black/40"
            />
          </div>
        </div>

        {/* Chest Lid */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[45%] rounded-t-lg origin-bottom"
          animate={state === 'hover' ? {
            rotateX: [-2, 2, -2]
          } : {}}
          transition={{
            duration: 0.5,
            repeat: state === 'hover' ? 2 : 0
          }}
          style={{
            background: style.lid,
            boxShadow: `0 -2px 6px rgba(0,0,0,0.3), inset 0 2px 4px ${style.rimLight}`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Lid Accent Stripe */}
          <div 
            className="absolute top-1/2 left-0 right-0 h-1"
            style={{
              background: style.accent,
              boxShadow: `0 0 4px ${style.glow}`
            }}
          />

          {/* Lid Gem (for gold and diamond) */}
          {(material === 'gold' || material === 'diamond') && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{
                background: material === 'gold' ? '#FF4500' : '#00FFFF',
                boxShadow: `0 0 8px ${material === 'gold' ? '#FF4500' : '#00FFFF'}, inset 0 1px 2px white`
              }}
            />
          )}
        </motion.div>

        {/* Key Light Highlight */}
        <div 
          className="absolute top-0 left-0 w-1/3 h-1/3 rounded-tl-lg pointer-events-none"
          style={{
            background: `radial-gradient(circle at top left, ${style.rimLight}80, transparent)`,
            mixBlendMode: 'overlay'
          }}
        />

        {/* Glow Effect */}
        {state !== 'idle' && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            animate={{
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity
            }}
            style={{
              boxShadow: `0 0 20px ${style.glow}, 0 0 40px ${style.glow}`
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

// Large 3D Chest for redemption sequence
export function RedemptionChest3D({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="relative w-[400px] h-[400px]"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 1 }}
    >
      {/* Animated Background Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Light Rays */}
      <AnimatePresence>
        <motion.div
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: 1 }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 bottom-1/2 w-2 origin-bottom"
              style={{
                height: '200px',
                background: 'linear-gradient(to top, rgba(255,215,0,0.6), transparent)',
                transform: `rotate(${i * 45}deg)`,
                filter: 'blur(2px)'
              }}
              animate={{
                scaleY: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: 1 + i * 0.1
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Main Chest */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          y: [-20, 0],
          rotateX: [0, 15, 0]
        }}
        transition={{
          duration: 5,
          times: [0, 0.4, 1]
        }}
      >
        <Chest3D material="gold" size="large" state="opening" />
      </motion.div>

      {/* Coin Burst */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-6 h-6 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #F9C74F, #F8961E)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.5)'
            }}
            animate={{
              x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 300],
              y: [0, -150, -300],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              delay: 2 + i * 0.05,
              ease: 'easeOut'
            }}
          />
        ))}
      </motion.div>

      {/* Success Text */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 3.5, duration: 0.5 }}
      >
        {/* Removed duplicate "Reward Claimed!" text to avoid duplication */}
      </motion.div>
    </motion.div>
  );
}
