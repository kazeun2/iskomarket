import React from 'react';
import { GraduationCap, ShoppingBag } from 'lucide-react';
import iskoMarketLogo from 'figma:asset/3b968d3684aca43d11e97d92782eb8bb2dea6d18.png';

interface IskoMarketLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon-only';
  className?: string;
}

export function IskoMarketLogo({ size = 'md', variant = 'full', className = '' }: IskoMarketLogoProps) {
  const logoSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <div className={`${className} relative`}>
        <div className="flex items-center justify-center">
          <img 
            src={iskoMarketLogo} 
            alt="IskoMarket Logo" 
            className={`${logoSizes[size]} object-contain dark:brightness-0 dark:invert dark:opacity-90`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center justify-center">
        <img 
          src={iskoMarketLogo} 
          alt="IskoMarket Logo" 
          className={`${logoSizes[size]} object-contain dark:brightness-0 dark:invert dark:opacity-90`}
        />
      </div>
      <div>
        <h1 className="text-xl text-foreground dark:text-foreground font-bold">IskoMarket</h1>
      </div>
    </div>
  );
}
