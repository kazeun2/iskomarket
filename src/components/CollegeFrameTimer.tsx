import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CollegeFrameTimerProps {
  expiresAt: string;
  collegeName: string;
  className?: string;
}

export function CollegeFrameTimer({ expiresAt, collegeName, className = '' }: CollegeFrameTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        return 'Expired';
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h left`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m left`;
      } else {
        return `${minutes}m left`;
      }
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft || timeLeft === 'Expired') {
    return null;
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${className}`}
      style={{
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        color: 'rgb(99, 102, 241)'
      }}
    >
      <Clock className="h-3 w-3" />
      <span className="font-medium">{collegeName} Frame</span>
      <span className="opacity-80">• {timeLeft}</span>
    </div>
  );
}
