import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

interface IskoinMeterWidgetProps {
  iskoins: number;
  onChange?: number; // Amount changed (positive or negative)
  onClick: () => void;
}

export function IskoinMeterWidget({ iskoins, onChange, onClick }: IskoinMeterWidgetProps) {
  const [showChange, setShowChange] = useState(false);
  const [glowing, setGlowing] = useState(false);

  useEffect(() => {
    if (onChange !== undefined && onChange !== 0) {
      setShowChange(true);
      setGlowing(true);

      const changeTimer = setTimeout(() => {
        setShowChange(false);
      }, 2000);

      const glowTimer = setTimeout(() => {
        setGlowing(false);
      }, 1000);

      return () => {
        clearTimeout(changeTimer);
        clearTimeout(glowTimer);
      };
    }
  }, [onChange]);

  return (
    <>
      <style>
        {`
          @keyframes bounce-subtle-iskoin {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }

          .animate-bounce-subtle-iskoin {
            animation: bounce-subtle-iskoin 2s ease-in-out infinite;
          }

          @keyframes coin-rotate {
            0% {
              transform: rotateY(0deg);
            }
            100% {
              transform: rotateY(360deg);
            }
          }

          .animate-coin-rotate {
            animation: coin-rotate 3s ease-in-out infinite;
            transform-style: preserve-3d;
          }

          @keyframes glow-pulse-iskoin {
            0%, 100% {
              box-shadow: 
                0 0 20px rgba(245, 158, 11, 0.4),
                0 0 40px rgba(245, 158, 11, 0.2),
                0 8px 16px rgba(0, 0, 0, 0.3),
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                inset 0 -2px 4px rgba(0, 0, 0, 0.2);
            }
            50% {
              box-shadow: 
                0 0 30px rgba(245, 158, 11, 0.6),
                0 0 60px rgba(245, 158, 11, 0.3),
                0 8px 16px rgba(0, 0, 0, 0.3),
                inset 0 2px 4px rgba(255, 255, 255, 0.4),
                inset 0 -2px 4px rgba(0, 0, 0, 0.3);
            }
          }

          .glow-pulse-iskoin {
            animation: glow-pulse-iskoin 2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="fixed bottom-6 left-6 z-[9999]">
        <button
          onClick={onClick}
          className={`
            group relative
            transition-all duration-300
            hover:scale-105 active:scale-95
          `}
        >
          {/* 3D Iskoin Button with realistic coin appearance - Smaller */}
          <div 
            className={`
              relative h-11 w-11 rounded-full flex items-center justify-center
              ${glowing ? 'glow-pulse-iskoin' : ''}
            `}
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              boxShadow: `
                0 4px 8px rgba(245, 158, 11, 0.25),
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                inset 0 -2px 4px rgba(0, 0, 0, 0.2)
              `,
              border: '2px solid rgba(251, 191, 36, 0.6)',
              transform: 'perspective(100px) rotateX(5deg)'
            }}
          >
            {/* Inner coin detail - creates 3D depth */}
            <div 
              className="absolute inset-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 50%, #f59e0b 100%)',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(255, 255, 255, 0.3)'
              }}
            />

            {/* Coin icon with animation */}
            <div className="relative z-10 animate-coin-rotate">
              <Coins 
                className="w-5 h-5 text-foreground" 
                style={{ 
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
                  transform: 'translateZ(10px)'
                }} 
              />
            </div>

            {/* Iskoin count badge - positioned properly to avoid overlap */}
            <div 
              className="absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-[9px] font-bold text-foreground flex items-center justify-center min-w-[26px]"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.6)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
              }}
            >
              {iskoins}
            </div>

            {/* Sparkle effect when glowing */}
            {glowing && (
              <div className="absolute inset-0 rounded-full">
                <div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-200 rounded-full animate-ping"
                  style={{ boxShadow: '0 0 10px rgba(254, 240, 138, 0.8)' }}
                />
                <div 
                  className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-200 rounded-full animate-ping"
                  style={{ 
                    boxShadow: '0 0 10px rgba(254, 240, 138, 0.8)',
                    animationDelay: '0.5s'
                  }}
                />
              </div>
            )}
          </div>

          {/* Change Indicator - Enhanced 3D */}
          {showChange && onChange !== undefined && onChange !== 0 && (
            <div
              className={`
                absolute -top-2 -right-2 px-2 py-1 rounded-full text-[10px] font-bold
                flex items-center gap-0.5 animate-in zoom-in duration-300
                ${onChange > 0 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-foreground' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-foreground'
                }
              `}
              style={{
                boxShadow: onChange > 0
                  ? '0 2px 8px rgba(34, 197, 94, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                  : '0 2px 8px rgba(239, 68, 68, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
              }}
            >
              {onChange > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  +{onChange}
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3" />
                  {onChange}
                </>
              )}
            </div>
          )}

          {/* Hover tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 rounded-lg bg-[#006400] dark:bg-[#1e6b1e] text-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
            Click to open Reward Chest
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#006400] dark:border-t-[#1e6b1e]" />
          </div>
        </button>
      </div>
    </>
  );
}
