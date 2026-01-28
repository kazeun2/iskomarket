import * as React from 'react';
import { useState, useEffect } from 'react';
import { Sparkles, Star, GraduationCap, Award, Crown, Plus, Coins, Trash2, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chest3D, RedemptionChest3D } from './3DChest';
import { DailySpinModal } from './DailySpinModal';
import { Button } from './ui/button';
import { ShoutOutFeatureModal } from './ShoutOutFeatureModal';
import { GlowNameEffectModal } from './GlowNameEffectModal';
import { toast } from 'sonner';

interface Reward {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cost: number;
  emoji: string;
}

const rewards: Reward[] = [
  {
    id: 'shout-out',
    emoji: '📣',
    icon: <Award className="w-6 h-6" />,
    title: 'Shout-Out Feature',
    description: 'Feature on Trusted Student Board',
    cost: 25
  },
  {
    id: 'glow-name',
    emoji: '🌟',
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Glow Name Effect',
    description: 'Animated glowing username for 3 days',
    cost: 20
  }
];

interface RewardChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userIskoins: number;
  onRedeem: (reward: Reward) => void;
  onIskoinChange?: (amount: number) => void;
  userCreditScore?: number;
  currentUser?: any;
  userProducts?: any[];
  isAdmin?: boolean;
  isDarkMode?: boolean;
  meetupLocations?: string[];
  onFeaturedProductAdd?: (productData: any) => void;
  onTrustedStudentAdd?: (studentData: any) => void;
  onGlowNameActivate?: (glowData: any) => void;
  onCollegeFrameActivate?: (frameData: any) => void;
} 

export const RewardChestModal = ({ 
  isOpen, 
  onClose, 
  userIskoins, 
  onRedeem, 
  onIskoinChange,
  userCreditScore = 100,
  currentUser,
  userProducts = [],
  isAdmin = false,
  isDarkMode = true,
  meetupLocations = [],
  onFeaturedProductAdd,
  onTrustedStudentAdd,
  onGlowNameActivate,
  onCollegeFrameActivate
}: RewardChestModalProps) => {
  const [redeemedRewardId, setRedeemedRewardId] = useState<string | null>(null);
  const [showChestAnimation, setShowChestAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDailySpinModal, setShowDailySpinModal] = useState(false);
  const [activeRewardModal, setActiveRewardModal] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [editCost, setEditCost] = useState<number>(0);
  const [rewardCosts, setRewardCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const actualUserProducts = userProducts.length > 0 ? userProducts : [
    { id: 1, title: 'iPhone 13 Pro Max', price: 45000, category: 'Electronics', images: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400'] },
    { id: 2, title: 'Gaming Laptop', price: 35000, category: 'Electronics', images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400'] },
    { id: 3, title: 'Textbook Bundle', price: 2500, category: 'Books', images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'] }
  ];

  const actualCurrentUser = currentUser || {
    username: 'JuanDeLaCruz',
    program: 'BS Computer Science',
    bio: 'Passionate about tech and helping fellow students!',
    rating: 4.8,
    creditScore: userCreditScore
  };

  if (!isOpen) return null;

  const getChestMaterial = (cost: number): 'bronze' | 'silver' | 'gold' | 'diamond' => {
    if (cost === 20) return 'bronze';
    if (cost === 25) return 'silver';
    if (cost === 30) return 'gold';
    return 'diamond';
  };

  const getCardGradient = (cost: number): string => {
    if (cost === 20) {
      return isDarkMode 
        ? 'linear-gradient(180deg, #4a3218 0%, #5d4428 25%, #6f5638 50%, #816848 75%, #937a58 100%)'
        : 'linear-gradient(180deg, #654321 0%, #7B5B3F 25%, #8B6B47 50%, #A0826D 75%, #B8956A 100%)';
    }
    if (cost === 25) {
      return isDarkMode
        ? 'linear-gradient(180deg, #5a6570 0%, #6d7c88 25%, #8090a0 50%, #93a3b3 75%, #a6b6c6 100%)'
        : 'linear-gradient(180deg, #8B96A0 0%, #A8B5C2 25%, #C0CBDA 50%, #D8E0E8 75%, #E8EDF2 100%)';
    }
    if (cost === 30) {
      return isDarkMode
        ? 'linear-gradient(180deg, #8b6508 0%, #a07820 25%, #b58b2f 50%, #ca9e3e 75%, #dfb14d 100%)'
        : 'linear-gradient(180deg, #B8860B 0%, #D4A229 25%, #EABE3F 50%, #FFD966 75%, #FFEB99 100%)';
    }
    return isDarkMode
      ? 'linear-gradient(180deg, #8b6508 0%, #a07820 20%, #b58b2f 40%, #ca9e3e 60%, #dfb14d 80%, #f4c45c 100%)'
      : 'linear-gradient(180deg, #B8860B 0%, #D4A229 20%, #EABE3F 40%, #FFD966 60%, #FFEB99 80%, #FFF4CC 100%)';
  };

  const getCardGlow = (cost: number): string => {
    if (cost === 20) return '0 0 24px rgba(101, 67, 33, 0.5), 0 8px 24px rgba(0, 0, 0, 0.5)';
    if (cost === 25) return '0 0 24px rgba(168, 181, 194, 0.6), 0 8px 24px rgba(0, 0, 0, 0.5)';
    if (cost === 30) return '0 0 28px rgba(255, 215, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.5)';
    return '0 0 32px rgba(255, 215, 0, 0.7), 0 12px 32px rgba(0, 0, 0, 0.5)';
  };

  const getRewardCost = (reward: Reward) => {
    return rewardCosts[reward.id] || reward.cost;
  };

  const handleRedeem = (reward: Reward) => {
    const actualCost = getRewardCost(reward);
    if (userIskoins >= actualCost) {
      setActiveRewardModal(reward.id);
    }
  };

  const handleEditCost = (reward: Reward) => {
    setEditingReward(reward.id);
    setEditCost(getRewardCost(reward));
  };

  const handleSaveCost = () => {
    if (editingReward && editCost > 0) {
      setRewardCosts({ ...rewardCosts, [editingReward]: editCost });
      setEditingReward(null);
      toast.success('Iskoin cost updated successfully');
    }
  };

  const handleDeleteReward = (reward: Reward) => {
    toast.error('Delete Reward', { description: `Deleting ${reward.title} - Feature coming soon` });
  };

  const handleShoutOutConfirm = (showBio: boolean) => {
    // Add the student to trusted students
    if (onTrustedStudentAdd) {
      onTrustedStudentAdd({ ...actualCurrentUser, showBio });
    }
    playChestAnimationAndFinish();
  };

  const handleGlowNameConfirm = (glowStyle: string) => {
    if (onGlowNameActivate) {
      onGlowNameActivate({ username: actualCurrentUser.username, style: glowStyle });
    }
    playChestAnimationAndFinish();
  }; 

  const playChestAnimationAndFinish = () => {
    setActiveRewardModal(null);
    setShowChestAnimation(true);
    setShowConfetti(true);

    const currentReward = rewards.find(r => r.id === activeRewardModal);
    if (currentReward) {
      setTimeout(() => {
        setShowChestAnimation(false);
        setShowConfetti(false);
        onRedeem(currentReward);
      }, 5000);
    }
  };

  return (
    <>
      {/* Premium Glassmorphism Background */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-50 p-4" 
        style={{ 
          background: isDarkMode 
            ? 'rgba(0,0,0,0.75)'
            : 'rgba(255,255,255,0.60)',
          backdropFilter: isDarkMode ? 'blur(25px)' : 'blur(20px)'
        }}
      >
        {/* 5-Second 3D Redemption Sequence */}
        <AnimatePresence>
          {showChestAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: [0.85, 1.10, 1.00] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="fixed inset-0 flex items-center justify-center z-[100]"
              style={{
                background: 'radial-gradient(ellipse at center, #FFD562 0%, #B8860B 70%)'
              }}
            >
              <RedemptionChest3D onComplete={() => setShowChestAnimation(false)} />
              <div 
                className="absolute text-center"
                style={{
                  color: '#FFF6D9',
                  textShadow: '0 2px 8px rgba(184, 134, 11, 0.6)',
                  fontSize: '32px',
                  fontWeight: 700,
                  marginTop: '200px'
                }}
              >
                Reward Claimed! 🎉
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti Effect */}
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[99] flex items-center justify-center">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: 0, 
                    x: 0, 
                    opacity: 1,
                    rotate: 0
                  }}
                  animate={{ 
                    y: [0, -400, -800],
                    x: [(Math.random() - 0.5) * 300, (Math.random() - 0.5) * 600],
                    opacity: [1, 1, 0],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
                  }}
                  transition={{ 
                    duration: 3,
                    delay: i * 0.015,
                    ease: "easeOut"
                  }}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    background: ['#FFD700', '#00C6FF', '#FF6B9D', '#4ECDC4', '#95E1D3', '#FFA500', '#FF69B4'][i % 7]
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Modal Container */}
        <div 
          className="modal-standard rounded-[20px] max-w-[1200px] w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-400 relative"
          style={{
            background: isDarkMode 
              ? 'linear-gradient(180deg, #111111 0%, #1a1a1a 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f2f2f2 100%)',
            border: isDarkMode 
              ? '1px solid rgba(0,255,150,0.25)'
              : '1px solid rgba(0,0,0,0.08)',
            boxShadow: isDarkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 4px 24px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="relative z-10 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div 
              className="sticky top-0 px-8 py-6 flex items-center justify-between z-[70]"
              style={{
                background: isDarkMode 
                  ? 'linear-gradient(180deg, #111111 0%, #1a1a1a 100%)'
                  : 'linear-gradient(180deg, #ffffff 0%, #f2f2f2 100%)',
                borderBottom: isDarkMode 
                  ? '1px solid rgba(0,255,155,0.12)'
                  : '1px solid rgba(0,0,0,0.08)',
                boxShadow: isDarkMode
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h2 
                    style={{ 
                      fontSize: '24px',
                      fontWeight: 700,
                      color: isDarkMode ? '#32d96c' : '#0fa968',
                      textShadow: isDarkMode ? '0 0 12px rgba(50, 217, 108, 0.3)' : 'none'
                    }}
                  >
                    Iskoin Reward Chest
                  </h2>
                  <p 
                    className="text-[13px] mt-1 tracking-wide" 
                    style={{ 
                      fontWeight: 500,
                      color: isDarkMode ? '#cfcfcf' : '#6f6f6f'
                    }}
                  >
                    Redeem exclusive features using your earned Iskoins
                  </p>
                </div>
              </div>

              {/* Right side: Iskoin Balance + Close */}
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => setShowDailySpinModal(true)}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-full text-sm font-semibold shadow-lg cursor-pointer hover:shadow-xl transition-all flex items-center gap-2"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #D4A229 0%, #B8860B 100%)'
                      : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: isDarkMode ? '#ffffff' : '#333333',
                    boxShadow: isDarkMode 
                      ? '0 0 8px rgba(212, 162, 41, 0.4)'
                      : '0 2px 8px rgba(255, 215, 0, 0.3)'
                  }}
                  title="Click to open Daily Spin"
                >
                  <Coins className="h-4 w-4" />
                  <span>{userIskoins} Iskoins</span>
                </motion.button>

                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    background: isDarkMode ? 'rgba(20, 20, 20, 0.8)' : '#ffffff',
                    border: isDarkMode 
                      ? '1px solid rgba(52, 229, 122, 0.4)'
                      : '1px solid #0fa968',
                    color: isDarkMode ? '#32d96c' : '#0fa968',
                    boxShadow: isDarkMode
                      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                      : '0 1px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(32, 32, 32, 1)' : '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(20, 20, 20, 0.8)' : '#ffffff';
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Rewards Grid Container with Dark Glass Card */}
            <div 
              className="mx-6 my-6 rounded-[20px] p-8"
              style={{
                background: isDarkMode 
                  ? 'rgba(10, 20, 15, 0.55)'
                  : '#f7f7f7',
                border: isDarkMode 
                  ? '1px solid rgba(0,255,155,0.12)'
                  : 'none',
                boxShadow: isDarkMode
                  ? 'inset 0px 0px 25px rgba(0,0,0,0.55), 0 4px 12px rgba(0, 0, 0, 0.2)'
                  : '0 2px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Tint Overlay */}
              {isDarkMode && (
                <div 
                  className="absolute inset-0 rounded-[20px] pointer-events-none"
                  style={{
                    background: 'rgba(0, 255, 155, 0.04)'
                  }}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative max-w-[880px] mx-auto">
                {rewards.map((reward) => {
                  const actualCost = getRewardCost(reward);
                  const canAfford = userIskoins >= actualCost;
                  const isClaimed = redeemedRewardId === reward.id;
                  const chestMaterial = getChestMaterial(actualCost);
                  const cardGradient = getCardGradient(actualCost);
                  const cardGlow = getCardGlow(actualCost);
                  
                  return (
                    <motion.div
                      key={reward.id}
                      className={`
                        relative rounded-[26px] p-5 border transition-all duration-300 group flex flex-col
                        ${canAfford 
                          ? 'cursor-pointer' 
                          : 'opacity-50 cursor-not-allowed'
                        } w-full sm:w-[260px] md:w-[300px] lg:w-[340px]
                      `}
                      style={{
                        background: canAfford ? cardGradient : '#2a2a2a',
                        border: '1px solid rgba(0,0,0,0.2)',
                        boxShadow: canAfford 
                          ? `inset 0 3px 8px rgba(0, 0, 0, 0.25), 0 8px 20px rgba(0, 0, 0, 0.4)`
                          : 'none',
                        minHeight: '420px',
                        filter: canAfford ? 'none' : 'grayscale(0.4)',
                      }}
                      whileHover={canAfford ? {
                        y: -4,
                        boxShadow: cardGlow,
                        transition: { duration: 0.3, ease: "easeOut" }
                      } : {}}
                      whileTap={canAfford ? {
                        scale: 0.97,
                        transition: { duration: 0.15 }
                      } : {}}
                    >
                      {/* Dark vignette overlay for dark mode */}
                      {isDarkMode && canAfford && (
                        <div 
                          className="absolute inset-0 rounded-[26px] pointer-events-none"
                          style={{
                            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.1) 100%)'
                          }}
                        />
                      )}

                      {/* Reduced gloss highlight */}
                      {canAfford && (
                        <div 
                          className="absolute top-0 left-0 right-0 h-8 rounded-t-[26px] pointer-events-none"
                          style={{
                            background: isDarkMode
                              ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)'
                              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)',
                          }}
                        />
                      )}

                      {/* Admin Controls - Floating Pill */}
                      {isAdmin && (
                        <div 
                          className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1.5 rounded-xl z-[70]"
                          style={{
                            background: 'rgba(0,0,0,0.32)',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          {/* Edit Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCost(reward);
                            }}
                            className="transition-all duration-200 hover:scale-110"
                            title="Edit Iskoin Cost"
                          >
                            <Pencil 
                              className="w-5 h-5"
                              style={{ color: '#4DC9FF' }}
                              onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.color = '#28B4FF';
                              }}
                              onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.color = '#4DC9FF';
                              }}
                            />
                          </button>

                          {/* Delete Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReward(reward);
                            }}
                            className="transition-all duration-200 hover:scale-110"
                            title="Delete Reward"
                          >
                            <Trash2 
                              className="w-5 h-5"
                              style={{ color: '#FF5E5E' }}
                              onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.color = '#FF3A3A';
                              }}
                              onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.color = '#FF5E5E';
                              }}
                            />
                          </button>
                        </div>
                      )}

                      {/* 3D Chest with reduced glow */}
                      <div 
                        className="flex justify-center mb-3 pt-2 relative z-[5]"
                        style={{
                          filter: canAfford ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.18))' : 'none'
                        }}
                      >
                        <Chest3D 
                          material={chestMaterial} 
                          size="large" 
                          state={canAfford ? 'idle' : 'idle'}
                          onHover={() => {}}
                        />
                      </div>

                      {/* Iskoin Badge */}
                      <div 
                        className="absolute top-3 left-3 px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 z-[60]"
                        style={{
                          background: canAfford 
                            ? 'linear-gradient(135deg, #F8961E 0%, #F77F00 100%)' 
                            : '#6a6a6a',
                          boxShadow: canAfford 
                            ? '0 2px 8px rgba(248, 150, 30, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)' 
                            : 'none',
                        }}
                      >
                        <span className="text-xs">🪙</span>
                        <span 
                          className="text-xs text-white font-bold tracking-tight" 
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                        >
                          {actualCost}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between relative z-[5]">
                        <div className="text-center mb-4">
                          <h3 
                            style={{ 
                              fontWeight: 700,
                              fontSize: '15px',
                              lineHeight: '1.3',
                              minHeight: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isDarkMode 
                                ? (canAfford ? '#FFFFFF' : '#808080')
                                : (canAfford ? '#064B2F' : '#808080'),
                              textShadow: isDarkMode && canAfford ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                            }}
                          >
                            {reward.title}
                          </h3>
                          <p 
                            style={{ 
                              fontSize: '13px',
                              opacity: 0.95,
                              minHeight: '38px',
                              lineHeight: '1.4',
                              color: isDarkMode 
                                ? (canAfford ? '#D7F5E2' : '#606060')
                                : (canAfford ? '#2D5F49' : '#606060'),
                              textShadow: isDarkMode && canAfford ? '0 1px 3px rgba(0,0,0,0.4)' : 'none'
                            }}
                          >
                            {reward.description}
                          </p>
                        </div>

                        {/* Unified Redeem Button */}
                        <button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canAfford || isClaimed}
                          className="w-full py-2.5 rounded-[20px] transition-all duration-300 font-semibold text-center"
                          style={
                            isClaimed
                              ? {
                                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                  color: '#ffffff',
                                  border: '1px solid #FCD34D',
                                  fontSize: '13px',
                                  cursor: 'not-allowed'
                                }
                              : canAfford
                              ? {
                                  background: 'linear-gradient(135deg, #0F8A2C 0%, #0A5F1F 100%)',
                                  border: '1px solid #34E57A',
                                  color: '#FFFFFF',
                                  boxShadow: '0px 0px 12px rgba(52,229,122,0.35)',
                                  fontSize: '13px',
                                }
                              : {
                                  background: '#6B6B6B',
                                  color: '#B8B8B8',
                                  fontSize: '13px',
                                  cursor: 'not-allowed',
                                  border: 'none'
                                }
                          }
                          onMouseEnter={(e) => {
                            if (canAfford && !isClaimed) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #17A83A 0%, #0E7A2A 100%)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (canAfford && !isClaimed) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #0F8A2C 0%, #0A5F1F 100%)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          {isClaimed ? '✅ Claimed!' : canAfford ? 'Redeem' : 'Insufficient Iskoins'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div 
              className="mx-6 mb-6 px-6 py-4 rounded-[20px] text-center"
              style={{
                background: isDarkMode 
                  ? 'rgba(10, 20, 15, 0.55)'
                  : '#f0f0f0',
                border: isDarkMode 
                  ? '1px solid rgba(0,255,155,0.12)'
                  : 'none',
                boxShadow: isDarkMode
                  ? 'inset 0px 0px 25px rgba(0,0,0,0.55)'
                  : '0 1px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              <p 
                className="text-sm"
                style={{
                  color: isDarkMode ? '#32d96c' : '#0fa968'
                }}
              >
                💡 Earn more Iskoins by maintaining a 100 credit score each season
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Cost Modal */}
      {editingReward && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[200] p-4"
          style={{
            background: isDarkMode ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.60)',
            backdropFilter: isDarkMode ? 'blur(25px)' : 'blur(20px)'
          }}
        >
          <div 
            className="rounded-[20px] p-6 max-w-md w-full"
            style={{
              background: isDarkMode ? 'rgba(15, 25, 20, 0.95)' : '#FFF9EE',
              border: isDarkMode 
                ? '1px solid rgba(0,255,150,0.25)'
                : '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3 
              className="mb-4"
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: isDarkMode ? '#C7FFE0' : '#064B29'
              }}
            >
              Edit Iskoin Cost
            </h3>
            <p 
              className="mb-4 text-sm"
              style={{
                color: isDarkMode ? '#E5FFF2' : '#2D5F49'
              }}
            >
              Update the cost for {rewards.find(r => r.id === editingReward)?.title}
            </p>
            <input
              type="number"
              value={editCost}
              onChange={(e) => setEditCost(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg mb-4"
              style={{
                background: isDarkMode ? 'rgba(0,0,0,0.3)' : '#ffffff',
                border: isDarkMode 
                  ? '1px solid rgba(0,255,150,0.2)'
                  : '1px solid rgba(0,0,0,0.1)',
                color: isDarkMode ? '#ffffff' : '#000000'
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveCost}
                className="flex-1 py-2.5 rounded-[20px] font-semibold transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #0F8A2C 0%, #0A5F1F 100%)',
                  border: '1px solid #34E57A',
                  color: '#FFFFFF',
                  boxShadow: '0px 0px 12px rgba(52,229,122,0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #17A83A 0%, #0E7A2A 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0F8A2C 0%, #0A5F1F 100%)';
                }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingReward(null)}
                className="flex-1 py-2.5 rounded-[20px] font-semibold transition-all duration-200"
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e5e5',
                  color: isDarkMode ? '#ffffff' : '#333333',
                  border: 'none'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Spin Modal */}
      {showDailySpinModal && (
        <DailySpinModal
          isOpen={showDailySpinModal}
          onClose={() => setShowDailySpinModal(false)}
          currentIskoins={userIskoins}
          onSpinComplete={(amount) => {
            if (onIskoinChange) {
              onIskoinChange(amount);
            }
          }}
          userCreditScore={userCreditScore}
        />
      )}

      {/* Individual Reward Modals */}

      <ShoutOutFeatureModal
        isOpen={activeRewardModal === 'shout-out'}
        onClose={() => setActiveRewardModal(null)}
        currentUser={actualCurrentUser}
        onConfirm={handleShoutOutConfirm}
      />

      <GlowNameEffectModal
        isOpen={activeRewardModal === 'glow-name'}
        onClose={() => setActiveRewardModal(null)}
        username={actualCurrentUser.username}
        onConfirm={handleGlowNameConfirm}
      />
    </>
  );
}