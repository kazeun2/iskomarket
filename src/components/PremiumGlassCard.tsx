import React, { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';

interface PremiumGlassCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function PremiumGlassCard({ children, onClick, className = '' }: PremiumGlassCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-160 border border-emerald-700/14 dark:border-emerald-400/18 rounded-[20px] hover:scale-[1.02] hover:-translate-y-0.5 ${className}`}
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)', /* solid off-white in light mode */
        backdropFilter: 'none',
        boxShadow: `
          rgba(0, 160, 90, 0.06) 0 4px 24px,
          inset rgba(255, 255, 255, 0.85) 0 1px 3px
        `
      }}
    >
      <CardContent className="p-4 text-center relative">
        {/* Dark mode background */}
        <div className="absolute inset-0 dark:block hidden rounded-[20px] -z-10"
          style={{
            background: 'rgba(0, 20, 12, 0.55)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 255, 170, 0.18)',
            boxShadow: '0 0 22px rgba(0, 255, 170, 0.15)'
          }}
        />
        
        {/* Noise overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04] rounded-[20px]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            mixBlendMode: 'overlay'
          }}
        />
        
        {children}
      </CardContent>
    </Card>
  );
}
