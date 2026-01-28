import React, { useState, useEffect } from "react";
import {
  Store,
  User,
  Shield,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ShoppingBag,
  Heart,
  Bell,
  FileText,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import iskoMarketLogo from "figma:asset/3b968d3684aca43d11e97d92782eb8bb2dea6d18.png";
import { Button } from "./ui/button";
import { getSupabase } from '@/lib/supabaseClient'
import { Badge } from "./ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { CommunityGuidelines } from "./CommunityGuidelines";
import { ContactUsModal } from "./ContactUsModal";
import { UserAvatarWithHighlight } from "./UserAvatarWithHighlight";
import { toast } from "sonner";
import { 
  getUnreadNotificationCount, 
  subscribeToNotifications 
} from "../lib/services/notifications";
import { useAuth } from "../contexts/AuthContext";
import { adminFlags } from "../config/adminFlags";
import { isExampleMode } from "../utils/exampleMode";

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userType: string;
  setUserType: (type: string) => void;
  currentUser: any;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenProfileSettings: () => void;
  onOpenFeedback: () => void;
  onOpenNotifications?: () => void;
  notificationUnreadCount?: number;
}

export function Navigation({
  currentView,
  setCurrentView,
  userType,
  setUserType,
  currentUser,
  onSignOut,
  isDarkMode,
  onToggleTheme,
  onOpenProfileSettings,
  onOpenFeedback,
  onOpenNotifications,
  notificationUnreadCount = 0,
}: NavigationProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] =
    useState(false);
  const [
    showPasswordVerificationModal,
    setShowPasswordVerificationModal,
  ] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [internalUnreadCount, setInternalUnreadCount] = useState(0);

  const isExample = isExampleMode(currentUser);
  const hasUnreadNotifications = (notificationUnreadCount || internalUnreadCount) > 0;

  // Load initial unread count
  useEffect(() => {
    if (isExample || !user?.id) return;

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount(user.id);
        setInternalUnreadCount(count);
      } catch (error) {
        console.error("Error loading unread notification count:", error);
      }
    };

    loadUnreadCount();
  }, [user?.id, isExample]);

  // Subscribe to real-time notification updates
  useEffect(() => {
    if (isExample || !user?.id) return;

    const unsubscribe = subscribeToNotifications(
      user.id,
      () => {
        // New notification - increment count
        setInternalUnreadCount((prev) => prev + 1);
      },
      (updatedNotification) => {
        // Updated notification - recalculate count if read status changed
        if (updatedNotification.is_read) {
          setInternalUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, isExample]);

  const navigationItems =
    userType === "admin"
      ? [
          {
            id: "marketplace",
            label: "Marketplace",
            icon: Store,
          },
          {
            id: "cvsumarket",
            label: "CvSU Market",
            icon: ShoppingBag,
          },
          {
            id: "dashboard",
            label: "My Dashboard",
            icon: User,
          },
          { id: "admin", label: "Admin", icon: Shield },
        ]
      : [
          {
            id: "marketplace",
            label: "Marketplace",
            icon: Store,
          },
          {
            id: "cvsumarket",
            label: "CvSU Market",
            icon: ShoppingBag,
          },
          {
            id: "dashboard",
            label: "My Dashboard",
            icon: User,
          },
        ];

  return (
    // The navbar uses the theme token --nav-bg when available (set via `.theme-user` / `.theme-admin`)
    <nav
      className="sticky top-0 z-50 navbar"
      style={{
        background: isDarkMode ? 'var(--overview-cause-bg)' : 'rgba(255,255,255,0.75)',
        backdropFilter: isDarkMode ? 'blur(18px) saturate(160%)' : 'blur(14px) saturate(130%)',
        WebkitBackdropFilter: isDarkMode ? 'blur(18px) saturate(160%)' : 'blur(14px) saturate(130%)',
        borderBottom: isDarkMode ? '1px solid rgba(20,184,166,0.30)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDarkMode ? '0 6px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.05)'
      }}
    >
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex items-center justify-between" style={{ height: "68px" }}>
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src={iskoMarketLogo}
                alt="IskoMarket Logo"
                className="h-10 w-10 object-contain dark:brightness-0 dark:invert dark:opacity-90"
              />
            </div>
            <div>
              <h1 className="text-xl text-[#006400] dark:text-[#F7F6F2]">
                IskoMarket
              </h1>
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`nav-tab flex items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer ${ 
                    isActive
                      ? "bg-[#E9F7EE] dark:bg-[rgba(20,184,166,0.15)] text-[#1A8E3F] dark:text-[#14B8A6]"
                      : "text-[#004d1a] dark:text-[#C7EAC3] hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(20,184,166,0.1)]"
                  }`}
                  style={{
                    ...(isActive && { fontWeight: 600 }),
                  }}
                  title={item.label}
                  onMouseEnter={(e) => {
                    if (!isActive && isDarkMode) {
                      const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
                      if (icon) {
                        (icon as SVGElement).style.filter = 'none';
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && isDarkMode) {
                      const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
                      if (icon) {
                        (icon as SVGElement).style.filter = 'none';
                      }
                    }
                  }}
                >
                  <Icon
                    className="h-5 w-5 flex-shrink-0"
                    strokeWidth={2.5}
                    style={{
                      color: isActive
                        ? isDarkMode
                          ? "#14B8A6"
                          : "#1A8E3F"
                        : isDarkMode
                          ? "#C7EAC3"
                          : "#004d1a",
                      ...(isDarkMode &&
                        !isActive && {
                          filter: "drop-shadow(0 0 4px rgba(20, 184, 166, 0.4))",
                        }),
                      ...(isDarkMode &&
                        isActive && {
                          filter: "none",
                        }),
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications Button */}
            {adminFlags.navbarNotifications && (
            <div className="relative">
              <button
                data-notification-trigger
                className="relative h-11 w-11 p-0 flex items-center justify-center rounded-xl hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(20,184,166,0.1)] transition-all duration-300"
                onClick={onOpenNotifications}
                onMouseEnter={(e) => {
                  if (isDarkMode) {
                    const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
                    if (icon) {
                      (icon as SVGElement).style.filter = 'none';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDarkMode) {
                    const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
                    if (icon) {
                      (icon as SVGElement).style.filter = 'drop-shadow(0 0 4px rgba(20, 184, 166, 0.4))';
                    }
                  }
                }}
              >
                <Bell
                  className="h-5 w-5"
                  strokeWidth={2.5}
                  style={{
                    color: isDarkMode ? "#C7EAC3" : "#004d1a",
                    ...(isDarkMode && {
                      filter: "none",
                    }),
                  }}
                />
                {hasUnreadNotifications && (
                  <span className="absolute top-1 right-1 size-2.5 rounded-full bg-green-500 dark:bg-emerald-600 animate-pulse" />
                )}
              </button>
            </div>
            )}

            {/* Theme Toggle */}
            <div className="hidden md:flex items-center">
              <button
                className="relative h-11 w-11 p-0 flex items-center justify-center rounded-xl hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(20,184,166,0.1)] transition-all duration-300"
                onClick={onToggleTheme}
                aria-label={
                  isDarkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                onMouseEnter={(e) => {
                  if (isDarkMode) {
                    const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
                    if (icon) {
                      (icon as SVGElement).style.filter = 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.7))';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDarkMode) {
                    const icon = e.currentTarget.querySelector('svg') as SVGElement | null;
                    if (icon) {
                      (icon as SVGElement).style.filter = 'drop-shadow(0 0 4px rgba(20, 184, 166, 0.4))';
                    }
                  }
                }}
              >
                {isDarkMode ? (
                  <Sun
                    className="h-5 w-5"
                    strokeWidth={2.5}
                    style={{
                      color: "#C7EAC3",
                      filter: "drop-shadow(0 0 4px rgba(20, 184, 166, 0.4))",
                    }}
                  />
                ) : (
                  <Moon
                    className="h-5 w-5"
                    strokeWidth={2.5}
                    style={{ color: "#004d1a" }}
                  />
                )}
              </button>
            </div>

            {/* User Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(91,255,140,0.15)] p-2"
                >
                  <UserAvatarWithHighlight
                    user={{
                      name: currentUser?.name || "User",
                      username: currentUser?.username || "user",
                      avatar: currentUser?.avatar || "",
                      creditScore:
                        currentUser?.creditScore || 70,
                      rank: currentUser?.rank,
                      role: currentUser?.role || "buyer",
                      glowEffect: currentUser?.glowEffect,
                    }}
                    size="sm"
                    showRankTag={false}
                    showTooltip={false}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className={`
                  w-56
                  bg-card
                  ${isDarkMode ? 'border-[#14b8a6]/20' : 'border-[rgba(0,0,0,0.06)]'}
                  ${isDarkMode 
                    ? 'shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2),0_8px_32px_rgba(0,55,38,0.4)]' 
                    : 'shadow-[0_8px_32px_rgba(0,100,0,0.08),0_2px_8px_rgba(0,100,0,0.04)]'
                  }
                `}
              >
                <DropdownMenuItem
                  onClick={onOpenProfileSettings}
                  className={`
                    ${isDarkMode 
                      ? 'text-[#C7EAC3] hover:bg-[#14b8a6]/10 hover:text-[#4ade80] focus:bg-[#14b8a6]/10 focus:text-[#4ade80]' 
                      : 'text-[#004d1a] hover:bg-[#E8F5E9] hover:text-[#1B5E20] focus:bg-[#E8F5E9] focus:text-[#1B5E20]'
                    }
                  `}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onOpenFeedback}
                  className={`
                    ${isDarkMode 
                      ? 'text-[#C7EAC3] hover:bg-[#14b8a6]/10 hover:text-[#4ade80] focus:bg-[#14b8a6]/10 focus:text-[#4ade80]' 
                      : 'text-[#004d1a] hover:bg-[#E8F5E9] hover:text-[#1B5E20] focus:bg-[#E8F5E9] focus:text-[#1B5E20]'
                    }
                  `}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </DropdownMenuItem>
                {adminFlags.profileDeleteAccount && (
                <DropdownMenuItem
                  onClick={() =>
                    setShowDeleteAccountModal(true)
                  }
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="font-semibold">
                    Delete Account
                  </span>
                </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className={isDarkMode ? 'bg-[#14b8a6]/10' : 'bg-[#cfe8ce]'} />
                <DropdownMenuItem
                  onClick={() => setShowGuidelines(true)}
                  className={`
                    ${isDarkMode 
                      ? 'text-[#C7EAC3] hover:bg-[#14b8a6]/10 hover:text-[#4ade80] focus:bg-[#14b8a6]/10 focus:text-[#4ade80]' 
                      : 'text-[#004d1a] hover:bg-[#E8F5E9] hover:text-[#1B5E20] focus:bg-[#E8F5E9] focus:text-[#1B5E20]'
                    }
                  `}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Community Guidelines
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowContactUs(true)}
                  className={`
                    ${isDarkMode 
                      ? 'text-[#C7EAC3] hover:bg-[#14b8a6]/10 hover:text-[#4ade80] focus:bg-[#14b8a6]/10 focus:text-[#4ade80]' 
                      : 'text-[#004d1a] hover:bg-[#E8F5E9] hover:text-[#1B5E20] focus:bg-[#E8F5E9] focus:text-[#1B5E20]'
                    }
                  `}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Us
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDarkMode ? 'bg-[#14b8a6]/10' : 'bg-[#cfe8ce]'} />
                <DropdownMenuItem
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                  onClick={onSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(91,255,140,0.15)]"
              onClick={() =>
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }
            >
              {isMobileMenuOpen ? (
                <X
                  className="h-4 w-4"
                  style={{
                    color: isDarkMode ? "#C7EAC3" : "#004d1a",
                  }}
                />
              ) : (
                <Menu
                  className="h-4 w-4"
                  style={{
                    color: isDarkMode ? "#C7EAC3" : "#004d1a",
                  }}
                />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 navbar">
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-center py-3 rounded-md transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#E9F7EE] dark:bg-[#0D3618] text-[#1A8E3F] dark:text-[#3BE369]"
                          : "text-[#004d1a] dark:text-[#C7EAC3] hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(91,255,140,0.15)]"
                      }`}
                      title={item.label}
                    >
                      <Icon
                        className="h-6 w-6 flex-shrink-0"
                        style={{
                          color: isActive
                            ? isDarkMode
                              ? "#3BE369"
                              : "#1A8E3F"
                            : isDarkMode
                              ? "#C7EAC3"
                              : "#004d1a",
                        }}
                      />
                    </button>
                  );
                })}

                {/* Mobile Theme Toggle */}
                <button
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full flex items-center justify-center py-3 rounded-md hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(91,255,140,0.15)] transition-all duration-200 cursor-pointer text-[#004d1a] dark:text-[#C7EAC3]"
                  title={
                    isDarkMode ? "Light Mode" : "Dark Mode"
                  }
                >
                  <div className="flex items-center justify-center">
                    {isDarkMode ? (
                      <Sun
                        className="h-6 w-6"
                        style={{ color: "#C7EAC3" }}
                      />
                    ) : (
                      <Moon
                        className="h-6 w-6"
                        style={{ color: "#004d1a" }}
                      />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Guidelines Modal */}
      <CommunityGuidelines
        isOpen={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />

      {/* Contact Us Modal */}
      <ContactUsModal
        isOpen={showContactUs}
        onClose={() => setShowContactUs(false)}
        isDarkMode={isDarkMode}
      />

      {/* Delete Account Modal - Step 1: Confirmation */}
      <Dialog
        open={showDeleteAccountModal}
        onOpenChange={setShowDeleteAccountModal}
      >
        <DialogContent
          className={`
            sm:max-w-[480px] rounded-2xl
            ${isDarkMode 
              ? 'bg-gradient-to-br from-[#003726] to-[#021223] border-[#14b8a6]/20' 
              : 'bg-card border-[#cfe8ce]'
            }
            border-2
            ${isDarkMode 
              ? 'shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2),0_8px_32px_rgba(0,55,38,0.4)]' 
              : 'shadow-[0_8px_32px_rgba(0,100,0,0.08),0_2px_8px_rgba(0,100,0,0.04)]'
            }
          `}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl">
                Delete Account
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Confirm account deletion and review deactivation process
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#C7EAC3]/90' : 'text-[#004d1a]'}`}>
              Your account will be{" "}
              <strong className={isDarkMode ? 'text-[#4ade80]' : 'text-[#1B5E20]'}>deactivated immediately</strong>.
            </p>

            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#C7EAC3]/90' : 'text-[#004d1a]'}`}>
              If you do not log in within{" "}
              <strong className={isDarkMode ? 'text-[#4ade80]' : 'text-[#1B5E20]'}>30 days</strong>, your account and all
              associated data will be permanently deleted.
            </p>

            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#C7EAC3]/90' : 'text-[#004d1a]'}`}>
              You can reactivate your account anytime by logging
              in again within this period.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAccountModal(false)}
              className="flex-1"
              style={{
                borderRadius: '12px',
                padding: '10px 20px',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteAccountModal(false);
                setShowPasswordVerificationModal(true);
                setPassword("");
                setPasswordError("");
              }}
              className="flex-1"
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                border: '1px solid #EF4444',
                color: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0px 0px 12px rgba(220,38,38,0.35)',
                padding: '10px 20px',
                fontWeight: 600
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Proceed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Verification Modal - Step 2 */}
      <Dialog
        open={showPasswordVerificationModal}
        onOpenChange={setShowPasswordVerificationModal}
      >
        <DialogContent
          className={`
            sm:max-w-[480px] rounded-2xl
            ${isDarkMode 
              ? 'bg-gradient-to-br from-[#003726] to-[#021223] border-[#14b8a6]/20' 
              : 'bg-card border-[#cfe8ce]'
            }
            border-2
            ${isDarkMode 
              ? 'shadow-[0_0_0_1px_rgba(20,184,166,0.15),0_0_25px_rgba(20,184,166,0.2),0_8px_32px_rgba(0,55,38,0.4)]' 
              : 'shadow-[0_8px_32px_rgba(0,100,0,0.08),0_2px_8px_rgba(0,100,0,0.04)]'
            }
          `}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-xl">
                Confirm Your Password
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Enter your password to verify your identity before deleting your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-[#C7EAC3]/90' : 'text-[#004d1a]'}`}>
              For security purposes, please enter your account
              password to continue with deletion.
            </p>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className={`
                  w-full pr-10 
                  ${passwordError ? "border-red-500" : ""}
                  ${isDarkMode 
                    ? 'bg-[#0a2f1f]/40 border-[#14b8a6]/20 text-[#C7EAC3] placeholder:text-[#C7EAC3]/50' 
                    : 'bg-card border-[#cfe8ce] text-[#004d1a] placeholder:text-[#004d1a]/50'
                  }
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`
                  absolute right-3 top-1/2 -translate-y-1/2
                  ${isDarkMode ? 'text-[#14b8a6]/70 hover:text-[#14b8a6]' : 'text-[#4CAF50]/70 hover:text-[#4CAF50]'}
                `}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {passwordError}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordVerificationModal(false);
                setPassword("");
                setPasswordError("");
              }}
              className="flex-1"
              style={{
                borderRadius: '12px',
                padding: '10px 20px',
                fontWeight: 600
              }}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                // Password verification against actual stored password
                const userEmail = currentUser?.email?.toLowerCase();
                
                if (!userEmail) {
                  setPasswordError("Unable to verify account. Please log in again.");
                  return;
                }
                // Verify credentials using Supabase (re-authenticate briefly)
                try {
                  const supabase = getSupabase();
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: userEmail,
                    password,
                  });

                  if (error || !data?.user) {
                    setPasswordError("Incorrect password. Please try again.");
                    return;
                  }
                } catch (err) {
                  console.error('Re-authentication failed', err);
                  setPasswordError('Unable to verify credentials. Please try again later.');
                  return;
                }

                // Password is correct - call server to hard-delete the account
                try {
                  const supabase = getSupabase();
                  const session = await supabase.auth.getSession();
                  const token = session.data?.session?.access_token;

                  // Use dev server route when running in Vite dev mode
                  const endpoint = (import.meta && import.meta.env && import.meta.env.DEV) ? '/dev/delete-account' : '/api/delete-account';

                  const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId: currentUser?.id })
                  });

                  // Parse body safely — some responses might be empty or not JSON
                  let json: any = null;
                  let text: string | null = null;
                  const contentType = res.headers.get('content-type') || '';
                  if (contentType.includes('application/json')) {
                    try {
                      json = await res.json();
                    } catch (err) {
                      // fallback to text if JSON parsing fails
                      text = await res.text();
                    }
                  } else {
                    text = await res.text();
                  }

                  if (!res.ok) {
                    if (res.status === 404) {
                      throw new Error('Delete endpoint not found (404). If running locally, start the dev server: `npm run dev:server` and ensure SUPABASE_SERVICE_ROLE_KEY is set.');
                    }
                    const message = json?.message || json?.error || text || res.statusText || `Request failed with status ${res.status}`;
                    throw new Error(message);
                  }

                  toast.success('Account deleted successfully');
                  setShowPasswordVerificationModal(false);
                  setPassword('');
                  setPasswordError('');

                  // sign out and redirect
                  setTimeout(() => onSignOut(), 500);
                } catch (err: any) {
                  console.error('Failed to delete account:', err);
                  toast.error(err?.message || 'Failed to delete account. Try again later.');
                }
              }}
              className="flex-1"
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                border: '1px solid #EF4444',
                color: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0px 0px 12px rgba(220,38,38,0.35)',
                padding: '10px 20px',
                fontWeight: 600
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
