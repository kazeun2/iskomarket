import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';

export interface RewardNotification {
  id: string;
  type: 'activated' | 'extended' | 'renewed' | 'failed';
  emoji: string;
  title: string;
  description: string;
  iskoinCost: number;
  expiryText: string;
}

interface RewardActivationPopupProps {
  notifications: RewardNotification[];
  onDismiss: (id: string) => void;
  onOpenTracker: () => void;
}

export function RewardActivationPopup({ notifications, onDismiss, onOpenTracker }: RewardActivationPopupProps) {
  const [animatingCoins, setAnimatingCoins] = useState<{ id: string; coins: number[] }[]>([]);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timers = notifications.map((notification) => {
      return setTimeout(() => {
        onDismiss(notification.id);
      }, 5000);
    });

    // Trigger coin animation
    notifications.forEach((notification) => {
      if (notification.type !== 'failed') {
        const coins = Array.from({ length: 5 }, (_, i) => i);
        setAnimatingCoins(prev => [...prev, { id: notification.id, coins }]);
        
        setTimeout(() => {
          setAnimatingCoins(prev => prev.filter(ac => ac.id !== notification.id));
        }, 2000);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, onDismiss]);

  const getColorClasses = (type: RewardNotification['type']) => {
    switch (type) {
      case 'activated':
        return {
          bg: 'from-green-500/20 to-emerald-500/20 dark:from-green-600/30 dark:to-emerald-600/30',
          border: 'border-green-500/50 dark:border-green-400/50',
          text: 'text-green-700 dark:text-green-300',
          glow: 'shadow-green-500/30'
        };
      case 'extended':
        return {
          bg: 'from-blue-500/20 to-cyan-500/20 dark:from-blue-600/30 dark:to-cyan-600/30',
          border: 'border-blue-500/50 dark:border-blue-400/50',
          text: 'text-blue-700 dark:text-blue-300',
          glow: 'shadow-blue-500/30'
        };
      case 'renewed':
        return {
          bg: 'from-amber-500/20 to-yellow-500/20 dark:from-amber-600/30 dark:to-yellow-600/30',
          border: 'border-amber-500/50 dark:border-amber-400/50',
          text: 'text-amber-700 dark:text-amber-300',
          glow: 'shadow-amber-500/30'
        };
      case 'failed':
        return {
          bg: 'from-red-500/20 to-rose-500/20 dark:from-red-600/30 dark:to-rose-600/30',
          border: 'border-red-500/50 dark:border-red-400/50',
          text: 'text-red-700 dark:text-red-300',
          glow: 'shadow-red-500/30'
        };
    }
  };

  const getTitle = (type: RewardNotification['type']) => {
    switch (type) {
      case 'activated': return '✅ Reward Activated!';
      case 'extended': return '🔁 Reward Extended!';
      case 'renewed': return '🔄 Reward Renewed!';
      case 'failed': return '⚠️ Insufficient Iskoins';
    }
  };

  // Limit to 3 visible notifications
  const visibleNotifications = notifications.slice(0, 3);

  if (visibleNotifications.length === 0) return null;

  return (
    <>
      <style>
        {`
          @keyframes float-up-reward {
            0% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) scale(0.5);
              opacity: 0;
            }
          }
          
          @keyframes shrink-width-reward {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }

          @keyframes bounce-subtle-reward {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
          }

          .animate-float-up-reward {
            animation: float-up-reward linear forwards;
          }

          .animate-shrink-width-reward {
            animation: shrink-width-reward linear forwards;
          }

          .animate-bounce-subtle-reward {
            animation: bounce-subtle-reward 2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {visibleNotifications.map((notification, index) => {
        const colors = getColorClasses(notification.type);
        const animCoins = animatingCoins.find(ac => ac.id === notification.id);

        return (
          <div
            key={notification.id}
            className="pointer-events-auto relative animate-in slide-in-from-right fade-in duration-400"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={onOpenTracker}
          >
            {/* Confetti/Sparkles Background */}
            {notification.type !== 'failed' && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className={`absolute w-3 h-3 text-amber-400 animate-ping opacity-0`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 1000}ms`,
                      animationDuration: `${1000 + Math.random() * 500}ms`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Floating Coins */}
            {animCoins && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {animCoins.coins.map((coin) => (
                  <div
                    key={coin}
                    className="absolute text-2xl animate-float-up-reward"
                    style={{
                      left: `${20 + coin * 15}%`,
                      bottom: '50%',
                      animationDelay: `${coin * 100}ms`,
                      animationDuration: '2000ms'
                    }}
                  >
                    💰
                  </div>
                ))}
              </div>
            )}

            {/* Main Card */}
            <div
              className={`
                relative w-80 bg-gradient-to-br ${colors.bg}
                backdrop-blur-lg border-2 ${colors.border}
                rounded-2xl shadow-2xl ${colors.glow} overflow-hidden
                cursor-pointer hover:scale-105 transition-transform duration-200
              `}
            >
              {/* Glow Effect */}
              {notification.type !== 'failed' && (
                <div className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-50 animate-pulse`} />
              )}

              {/* Content */}
              <div className="relative p-5">
                <div className="flex items-start gap-3">
                  {/* Icon with pulse effect */}
                  <div className="relative">
                    <div className={`text-3xl animate-bounce-subtle-reward ${notification.type !== 'failed' ? 'animate-pulse' : ''}`}>
                      {notification.emoji}
                    </div>
                    {notification.type !== 'failed' && (
                      <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-50 animate-ping" />
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`${colors.text} mb-1`}>
                      {getTitle(notification.type)}
                    </h4>
                    <p className="text-sm text-[#006400] dark:text-[#4ade80] mb-2">
                      {notification.description}
                    </p>
                    {notification.type !== 'failed' && (
                      <div className="flex items-center gap-3 text-xs text-[#006400]/70 dark:text-[#4ade80]/70">
                        <span className="flex items-center gap-1">
                          💰 -{notification.iskoinCost} Iskoins
                        </span>
                        <span className="flex items-center gap-1">
                          ⏳ {notification.expiryText}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(notification.id);
                    }}
                    className="text-[#006400]/60 hover:text-[#006400] dark:text-[#4ade80]/60 dark:hover:text-[#4ade80] transition-colors p-1 hover:bg-card/20 dark:hover:bg-black/20 rounded-lg"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-card/20 dark:bg-black/20">
                  <div
                    className={`h-full bg-gradient-to-r ${colors.bg} animate-shrink-width-reward`}
                    style={{ animationDuration: '5000ms' }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </>
  );
}
