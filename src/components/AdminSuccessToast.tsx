import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface AdminSuccessToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function AdminSuccessToast({ message, onClose, duration = 3000 }: AdminSuccessToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[10000] transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{
        animation: isClosing ? 'toast-slide-out 0.3s ease-in-out' : 'toast-slide-in 0.3s ease-in-out',
      }}
    >
      <div
        className="flex items-center gap-3 rounded-lg shadow-lg px-5 py-3 min-w-[320px] max-w-[400px]"
        style={{
          backgroundColor: '#2E7D32',
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
        <p className="text-white flex-1" style={{ fontSize: '14px', fontWeight: 500 }}>
          {message}
        </p>
        <button
          onClick={handleClose}
          className="text-white hover:bg-white/20 dark:hover:bg-[var(--card)]/20 rounded-full p-1 transition-colors duration-200"
          aria-label="Close toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
