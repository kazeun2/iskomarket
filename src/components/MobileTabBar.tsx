import React from 'react';
import { Home, ShoppingBag, PlusCircle, MessageSquare, User } from 'lucide-react';
import { Badge } from './ui/badge';

interface MobileTabBarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  unreadMessages?: number;
  notificationCount?: number;
}

export function MobileTabBar({ 
  currentView, 
  onViewChange, 
  unreadMessages = 0,
  notificationCount = 0 
}: MobileTabBarProps) {
  const tabs = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home,
      badge: notificationCount > 0 ? notificationCount : undefined
    },
    { 
      id: 'marketplace', 
      label: 'Shop', 
      icon: ShoppingBag 
    },
    { 
      id: 'post', 
      label: 'Post', 
      icon: PlusCircle,
      isAction: true 
    },
    { 
      id: 'messages', 
      label: 'Chat', 
      icon: MessageSquare,
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User 
    },
  ];

  return (
    <>
      {/* Mobile Tab Bar - Only visible on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-md border-t border-border shadow-2xl safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2 max-w-screen-sm mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            const isActionButton = tab.isAction;

            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl
                  transition-all duration-300 ease-out min-w-[64px]
                  ${isActive 
                    ? 'text-primary scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }
                  ${isActionButton
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg -mt-4 scale-110'
                    : ''
                  }
                  active:scale-95 touch-manipulation
                `}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon with active indicator */}
                <div className="relative">
                  <Icon 
                    className={`
                      ${isActionButton ? 'h-6 w-6' : 'h-5 w-5'}
                      transition-all duration-300
                      ${isActive && !isActionButton ? 'scale-110' : ''}
                    `}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  {/* Badge for notifications */}
                  {tab.badge && tab.badge > 0 && (
                    <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md animate-in zoom-in duration-200">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </div>
                  )}
                  
                  {/* Active indicator dot */}
                  {isActive && !isActionButton && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-in zoom-in duration-200" />
                  )}
                </div>

                {/* Label */}
                <span 
                  className={`
                    text-[10px] font-medium transition-all duration-300
                    ${isActive ? 'opacity-100' : 'opacity-70'}
                    ${isActionButton ? 'text-xs' : ''}
                  `}
                >
                  {tab.label}
                </span>

                {/* Active background gradient (subtle) */}
                {isActive && !isActionButton && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-xl -z-10 animate-in fade-in duration-300"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Safe area spacer for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-card" />
      </div>

      {/* Bottom padding spacer to prevent content from being hidden behind tab bar */}
      <div className="lg:hidden h-20" aria-hidden="true" />
    </>
  );
}

// Hook for auto-hiding tab bar on scroll
export function useMobileTabBarAutoHide() {
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const scrollThreshold = 10; // Pixels to scroll before hiding/showing

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold) {
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold - hide tab bar
        setIsVisible(false);
      } else {
        // Scrolling up - show tab bar
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return isVisible;
}

// Auto-hide variant of MobileTabBar
export function MobileTabBarAutoHide(props: MobileTabBarProps) {
  const isVisible = useMobileTabBarAutoHide();

  return (
    <div 
      className={`
        transition-transform duration-300 ease-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <MobileTabBar {...props} />
    </div>
  );
}
