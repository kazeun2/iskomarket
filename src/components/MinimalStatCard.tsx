import React, { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';

interface MinimalStatCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MinimalStatCard({ children, onClick, className = '' }: MinimalStatCardProps) {
  return (
    <Card
      className={`relative cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.1)] backdrop-blur-sm ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        {children}
      </CardContent>
    </Card>
  );
}