// ProfileHistory removed — stubbed to avoid UI exposure
import React from 'react';

export function ProfileHistory(_props: any) {
  return null;
}

// Animation for fade-in-slide effect
export const profileHistoryAnimationStyles = `
@keyframes fade-in-slide {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-slide {
  animation: fade-in-slide 0.4s ease-out forwards;
  opacity: 0;
}
`;
