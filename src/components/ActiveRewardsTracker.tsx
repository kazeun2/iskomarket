import React, { useState, useEffect } from 'react';
import { RotateCw, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

export interface ActiveReward {
  id: string;
  rewardId: string;
  emoji: string;
  title: string;
  activatedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expiring' | 'expired';
}

interface ActiveRewardsTrackerProps {
  activeRewards: ActiveReward[];
  userIskoins: number;
  onExtend: (reward: ActiveReward) => void;
  onRenew: (reward: ActiveReward) => void;
}

const rewardCosts: Record<string, number> = {
  'profile-frame': 4,
  'post-bump': 3,
  'shout-out': 25,
  'glow-name': 20,
  'product-slot': 2,
  'speed-chat': 4,
  'theme-customizer': 5
};

export function ActiveRewardsTracker({ activeRewards, userIskoins, onExtend, onRenew }: ActiveRewardsTrackerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTimeRemaining = (expiresAt: Date) => {
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatus = (reward: ActiveReward): 'active' | 'expiring' | 'expired' => {
    const diff = reward.expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'expired';
    if (diff <= 24 * 60 * 60 * 1000) return 'expiring'; // Less than 24 hours
    return 'active';
  };

  const activeItems = activeRewards.filter(r => getStatus(r) !== 'expired');
  const expiredItems = activeRewards.filter(r => getStatus(r) === 'expired');

  const canAffordExtend = (rewardId: string) => {
    const cost = rewardCosts[rewardId] || 0;
    return userIskoins >= Math.ceil(cost / 2); // Extension costs half
  };

  const canAffordRenew = (rewardId: string) => {
    const cost = rewardCosts[rewardId] || 0;
    return userIskoins >= cost;
  };

  return (
    <div className="space-y-5">
      {/* Active Rewards */}
      {activeItems.length > 0 && (
        <div className="space-y-4">
          {activeItems.map((reward) => {
            const status = getStatus(reward);
            const timeRemaining = getTimeRemaining(reward.expiresAt);
            const cost = rewardCosts[reward.rewardId] || 0;
            const extendCost = Math.ceil(cost / 2);

            return (
              <div
                key={reward.id}
                className="bg-[#F2F8F0] dark:bg-[rgba(0,255,160,0.08)] backdrop-blur-sm border border-[#E2EDE3] dark:border-emerald-400/30 rounded-[16px] p-4 shadow-[0_6px_16px_rgba(0,150,90,0.10)] dark:shadow-[0_4px_16px_rgba(16,185,129,0.12)] hover:shadow-[0_0_18px_rgba(0,190,150,0.12)] dark:hover:shadow-[0_8px_24px_rgba(16,185,129,0.18)] transition-all duration-300"
              >
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                  {/* Left: Icon with green neon glow */}
                  <div className="relative flex-shrink-0">
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(16, 185, 129, 0.4)',
                          '0 0 30px rgba(16, 185, 129, 0.6)',
                          '0 0 20px rgba(16, 185, 129, 0.4)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center text-3xl border border-[#E2EDE3] dark:border-emerald-400/30"
                    >
                      {reward.emoji}
                    </motion.div>
                  </div>

                  {/* Middle: Title and description */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[#006400] dark:text-emerald-200 mb-1 font-semibold">
                      {reward.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      <span
                        className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
                          ${
                            status === 'active'
                              ? 'bg-green-500/20 text-green-700 dark:text-green-300 border border-green-400/30'
                              : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-400/30'
                          }
                        `}
                      >
                        {status === 'active' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Expiring Soon
                          </>
                        )}
                      </span>

                      {/* Time Remaining */}
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-[#E2EDE3] dark:border-emerald-400/20 text-[#006400] dark:text-emerald-300 text-xs">
                        <Clock className="w-3 h-3" />
                        {timeRemaining}
                      </span>
                    </div>
                  </div>

                  {/* Right: Gift icon with subtle animation */}
                  <div className="flex-shrink-0">
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="text-4xl opacity-30"
                    >
                      🎁
                    </motion.div>
                  </div>
                </div>

                {/* Action Buttons - Below */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-[#E2EDE3] dark:border-emerald-400/10">
                  {/* Extend Button */}
                  <button
                    onClick={() => onExtend(reward)}
                    disabled={!canAffordExtend(reward.rewardId)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1
                      ${
                        canAffordExtend(reward.rewardId)
                          ? 'bg-blue-500/90 hover:bg-blue-600 text-white shadow-sm hover:shadow-md hover:scale-[1.02]'
                          : 'bg-[#EEF5EF] dark:bg-gray-600/30 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }
                    `}
                    title={`Extend for ${extendCost} Iskoins`}
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Extend</span>
                    <span className="text-xs opacity-80">💰{extendCost}</span>
                  </button>

                  {/* Renew Button */}
                  <button
                    onClick={() => onRenew(reward)}
                    disabled={!canAffordRenew(reward.rewardId)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1
                      ${
                        canAffordRenew(reward.rewardId)
                          ? 'bg-amber-500/90 hover:bg-amber-600 text-white shadow-sm hover:shadow-md hover:scale-[1.02]'
                          : 'bg-[#EEF5EF] dark:bg-gray-600/30 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }
                    `}
                    title={`Renew for ${cost} Iskoins`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Renew</span>
                    <span className="text-xs opacity-80">💰{cost}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Active Rewards */}
      {activeItems.length === 0 && expiredItems.length === 0 && (
        <div className="text-center py-6">
          <p className="text-[#006400]/40 dark:text-cyan-300/50 text-sm">
            No active rewards yet
          </p>
          <p className="text-[#006400]/30 dark:text-cyan-300/30 text-xs mt-1">
            Redeem rewards from the Reward Chest to see them here
          </p>
        </div>
      )}

      {/* Expired Rewards */}
      {expiredItems.length > 0 && (
        <div className="border-t border-[#006400]/20 dark:border-[#1e6b1e]/40">
          <div className="px-6 py-3 bg-[#006400]/5 dark:bg-[#1e6b1e]/10">
            <h4 className="text-sm text-[#006400]/70 dark:text-[#4ade80]/70">
              Expired Rewards
            </h4>
          </div>
          <div className="p-4 space-y-2">
            {expiredItems.map((reward) => {
              const cost = rewardCosts[reward.rewardId] || 0;
              
              return (
                <div
                  key={reward.id}
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 opacity-70"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl opacity-50">{reward.emoji}</span>
                      <div className="flex-1">
                        <h4 className="text-sm text-gray-600 dark:text-gray-400">
                          {reward.title}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1">
                          <XCircle className="w-3 h-3" />
                          Expired
                        </span>
                      </div>
                    </div>

                    {/* Renew Button */}
                    <button
                      onClick={() => onRenew(reward)}
                      disabled={!canAffordRenew(reward.rewardId)}
                      className={`
                        flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                        ${canAffordRenew(reward.rewardId)
                          ? 'bg-[#006400] hover:bg-[#004d00] dark:bg-[#1e6b1e] dark:hover:bg-[#155815] text-white shadow-sm'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
                        }
                      `}
                      title={`Renew for ${cost} Iskoins`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="hidden sm:inline">Renew</span>
                      <span className="text-xs opacity-80">💰{cost}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}