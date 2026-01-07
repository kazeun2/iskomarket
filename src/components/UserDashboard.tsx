import React, { useState, useEffect } from 'react';
import { Package, MessageCircle, Star, Eye, Edit2, Trash2, CheckCircle, Gift, Coins, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getPrimaryImage } from '../utils/images';
import { updateProduct } from '../lib/services/products';
import { ChatModal } from './ChatModal';
import { EditListingModal } from './EditListingModal';
import { TrustworthyBadge } from './TrustworthyBadge';
import { CreditScoreBadge } from './CreditScoreBadge';
import { CreditScoreRing } from './CreditScoreRing';
import { CreditScoreModal } from './CreditScoreModal';
import { getUserCreditScoreHistory } from '../lib/services/creditScore';
import { RankTierCompact } from './RankTier';
import { IskoinWalletCompact, shouldLockIskoins } from './IskoinWallet';
import { SeasonResetPopup, shouldShowSeasonResetPopup, getCurrentSeason, calculateSeasonResetScore } from './SeasonResetPopup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { TotalProductsModal, CompletedSalesModal, RatingHistoryModal } from './DashboardStatsModals';
import { InactivityBanner } from './InactivityBanner';
import { RewardChestModal } from './RewardChestModal';
import { ActiveRewardsTracker, ActiveReward } from './ActiveRewardsTracker';
import { RewardActivationPopup, RewardNotification } from './RewardActivationPopup';
import { IskoinMeterWidget } from './IskoinMeterWidget';
import { UserAvatarWithHighlight } from './UserAvatarWithHighlight';
// ProfileHistory component removed from dashboard (feature removed)
import { DailySpinModal } from './DailySpinModal';
import { FloatingDailySpinWidget } from './FloatingDailySpinWidget';
import { PriorityBadge, isTopFiveBuyer } from './PriorityBadge';
import { getCollegeFrameStyles } from './CollegeFrameBackground';
import { isExampleMode, filterExampleData } from '../utils/exampleMode';
import { useChatOptional } from '../contexts/ChatContext';
import { useOptionalOverlayManager } from '../contexts/OverlayManager';

import { DailySpinCard } from './DailySpinCard';
import { SeasonAnnouncementCard } from './SeasonAnnouncementCard';
import { UserProfileHeader } from './UserProfileHeader';


interface UserDashboardProps {
  currentUser: any;
  isDarkMode?: boolean;
  isAdmin?: boolean;
  onRequestEdit?: (product: any) => void;
}

export function UserDashboard({ currentUser, isDarkMode = true, isAdmin = false, onRequestEdit }: UserDashboardProps) {
  // Initialize with default values
  const [conversations, setConversations] = useState<any[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditScoreModal, setShowCreditScoreModal] = useState(false);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);
  const [showTotalProductsModal, setShowTotalProductsModal] = useState(false);

  const [showCompletedSalesModal, setShowCompletedSalesModal] = useState(false);
  const [showRatingHistoryModal, setShowRatingHistoryModal] = useState(false);
  
  // Get ChatContext (optional - won't throw if provider unavailable)
  const chatContext = useChatOptional();
  // Optional overlay manager (safe to call even when there is no provider)
  const overlayManager = useOptionalOverlayManager();
  
  // Update from context when it changes - create stable key to avoid infinite loops
  useEffect(() => {
    if (chatContext && chatContext.conversations && Array.isArray(chatContext.conversations)) {
      console.log('UserDashboard: Loading conversations from ChatContext', {
        count: chatContext.conversations.length,
        unreadCount: chatContext.totalUnreadCount
      });
      setConversations(chatContext.conversations);
      setTotalUnreadCount(chatContext.totalUnreadCount || 0);
      setChatLoading(chatContext.isLoading || false);
    }
  }, [chatContext?.conversations?.length, chatContext?.totalUnreadCount, chatContext?.isLoading]);

  // Refresh conversations when messages tab is opened
  useEffect(() => {
    if (activeTab === 'messages' && chatContext?.refreshConversations) {
      console.log('UserDashboard: Refreshing conversations for messages tab');
      chatContext.refreshConversations();
    }
  }, [activeTab, chatContext]);

  // Ensure we attempt an initial refresh when the context becomes available
  useEffect(() => {
    if (chatContext?.refreshConversations) {
      console.log('UserDashboard: Initial refresh of conversations from ChatContext');
      chatContext.refreshConversations();
    }
  }, [chatContext?.refreshConversations]);

  // Load credit history if the nested credit modal is opened (fallback environments without OverlayManager)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!showCreditScoreModal) return;
      setCreditHistoryLoading(true);
      try {
        const data = await getUserCreditScoreHistory(currentUser?.id);
        if (!mounted) return;
        setCreditHistory(data || []);
      } catch (e) {
        console.error('Failed to load credit history', e);
        if (!mounted) return;
        setCreditHistory([]);
      } finally {
        if (mounted) setCreditHistoryLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [showCreditScoreModal, currentUser?.id]);
  
  // Rewards System State
  const [showRewardChest, setShowRewardChest] = useState(false);
  const [showDailySpin, setShowDailySpin] = useState(false);
  const [dailySpinState, setDailySpinState] = useState(() => {
    const lastSpinDate = localStorage.getItem('lastDailySpinDate');
    const today = new Date().toDateString();
    return {
      spinsLeft: lastSpinDate === today ? 0 : 1,
      rechargesLeft: lastSpinDate === today ? 0 : 3
    };
  });
  const [rewardNotifications, setRewardNotifications] = useState<RewardNotification[]>([]);
  const [activeRewards, setActiveRewards] = useState<ActiveReward[]>([]);
  const [currentIskoins, setCurrentIskoins] = useState(currentUser?.iskoins || 0);
  const [iskoinChange, setIskoinChange] = useState<number | undefined>(undefined);
  
  // Season Reset & Iskoin state
  const currentSeason = getCurrentSeason();
  const [showSeasonResetPopup, setShowSeasonResetPopup] = useState(false);
  const [userIskoins] = useState(currentUser?.iskoins || 0);
  const iskoinsLocked = shouldLockIskoins(currentUser?.creditScore || 70);
  
  // Check if season reset popup should be shown on mount
  React.useEffect(() => {
    if (shouldShowSeasonResetPopup(currentSeason)) {
      setShowSeasonResetPopup(true);
    }
  }, [currentSeason]);
  
  // Mock products data - only shown for example accounts
  const mockProducts = [
    {
      id: 1,
      title: "Advanced Calculus Textbook",
      price: 1200,
      status: "available",
      views: 45,
      interested: 8,
      image: "https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXh0Ym9va3MlMjBzdHVkeSUyMG1hdGVyaWFsc3xlbnwxfHx8fDE3NTkyMjEyNzd8MA&ixlib=rb-4.0&q=80&w=1080",
      datePosted: "2024-12-30",
      description: "Excellent condition, used for Math 151. All pages intact, no highlighting.",
      category: "Textbooks",
      condition: "Like New",
      location: "Gate 2"
    },
    {
      id: 2,
      title: "Scientific Calculator",
      price: 800,
      status: "sold",
      views: 23,
      interested: 5,
      image: "https://images.unsplash.com/photo-1715520530023-cc8a1b2044ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3VwcGxpZXMlMjBzdGF0aW9uZXJ5fGVufDF8fHx8MTc1OTIyMTI4Mnww&ixlib=rb-4.0&q=80&w=1080",
      datePosted: "2024-12-25",
      description: "Perfect for engineering students. All functions working properly.",
      category: "Electronics",
      condition: "Good",
      location: "Gate 1"
    }
  ];
  
  const [products, setProducts] = useState<any[]>(isExampleMode(currentUser) ? filterExampleData(mockProducts, currentUser) : []);
  const [productsLoading, setProductsLoading] = useState(false);

  // Load real user's products when currentUser changes (and keep example mode behavior)
  React.useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    async function loadMyProducts() {
      if (!currentUser) {
        setProducts(isExampleMode(currentUser) ? filterExampleData(mockProducts, currentUser) : []);
        return;
      }

      if (isExampleMode(currentUser)) {
        setProducts(filterExampleData(mockProducts, currentUser));
        return;
      }

      setProductsLoading(true);
      try {
        const { getUserProducts, subscribeToProducts } = await import('../lib/services/products');
        const data = await getUserProducts(currentUser.id);
        setProducts(data || []);

        // Subscribe to realtime product changes and reconcile only products for this user
        unsubscribe = subscribeToProducts({
          onInsert: async (p: any) => {
            if (p.seller_id !== currentUser.id) return;
            try {
              const { getProduct } = await import('../lib/services/products');
              const product = await getProduct(p.id);
              setProducts(prev => [product, ...prev]);
            } catch (e) {
              console.warn('Failed to fetch full product on realtime insert in UserDashboard, falling back to payload', e);
              const safe = p.seller ? p : { ...p, seller: { id: p.seller_id, username: String(p.seller_id), avatar_url: null, credit_score: 0, is_trusted_member: false } };
              setProducts(prev => [safe, ...prev]);
            }
          },
          onUpdate: (p: any) => {
            if (p.seller_id === currentUser.id) setProducts(prev => prev.map(x => x.id === p.id ? p : x));
          },
          onDelete: (id: string) => setProducts(prev => prev.filter(x => x.id !== id)),
        });
      } catch (e: any) {
        // Log full error with message to help debugging (avoid noisy stack traces)
        console.error('Failed to load My Products:', e?.message ?? e);
      } finally {
        setProductsLoading(false);
      }
    }

    loadMyProducts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Mock user data with rating info for trustworthy badge - only shown for example accounts
  const mockUserStats = {
    totalProducts: 8,
    completedSales: 12,
    rating: 4.8,
    totalRatings: 23
  };
  
  // Use example stats for example accounts, real stats for real users
  const userStats = isExampleMode(currentUser) ? mockUserStats : {
    totalProducts: products.length,
    completedSales: 0, // Would come from actual user data
    rating: 0,
    totalRatings: 0
  };

  // Mock reviews data - only shown for example accounts
  const mockReviews = [
    {
      id: 1,
      from: "Jennifer Lopez",
      rating: 5,
      comment: "Great seller! Item was exactly as described and met on time.",
      date: "2024-12-28",
      avatar: ""
    },
    {
      id: 2,
      from: "Michael Chen",
      rating: 4,
      comment: "Good transaction, fast response.",
      date: "2024-12-25",
      avatar: ""
    }
  ];

  // Filter reviews based on example mode
  const reviews = filterExampleData(mockReviews, currentUser);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-accent/20 text-accent-foreground hover:bg-accent/30';
      case 'sold': return 'bg-primary/20 text-primary-foreground hover:bg-primary/30';
      default: return 'bg-muted text-muted-foreground hover:bg-muted/80';
    }
  };

  const handleReply = (conversation: any) => {
    console.log('[UserDashboard] Opening chat for conversation:', conversation);
    
    // Extract other user from conversation
    const otherUserId = conversation.other_user_id;
    const otherUser = {
      id: otherUserId,
      name: conversation.other_user_name,
      username: conversation.other_user_username,
    };

    setSelectedMessage({
      id: conversation.conversation_id,
      name: otherUser.name,
      avatar: conversation.other_user_avatar,
      program: conversation.other_user_program,
      product: conversation.product_title,
      otherUser: otherUser,
      conversationId: conversation.conversation_id,
      productId: conversation.product_id,
    });
    setShowChat(true);
  };

  const handleEditProduct = (product: any) => {
    // Prefer parent-managed edit modal if provided
    if (typeof onRequestEdit === 'function') {
      onRequestEdit(product);
      return;
    }

    // Fallback local behavior
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (updatedProduct: any) => {
    try {
      // Persist changes on the server and update local state with the authoritative server row
      const saved = await updateProduct(String(updatedProduct.id), updatedProduct);
      setProducts(prevProducts => 
        prevProducts.map(product => String(product.id) === String(saved.id) ? saved : product)
      );
      // Broadcast update so other app areas (global product list, open product details) update immediately
      try {
        window.dispatchEvent(new CustomEvent('iskomarket:product-updated', { detail: saved }));
      } catch (e) {
        // ignore if events not supported
      }

      toast.success('Product updated successfully!');
    } catch (err: any) {
      console.error('Failed to update product from dashboard', err);
      toast.error(err?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prevProducts => 
        prevProducts.filter(product => String(product.id) !== String(productId))
      );
      toast.success('Product deleted successfully!');
    }
  };

  const handleStatusChange = (productId: number, newStatus: string) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        String(product.id) === String(productId) ? { ...product, status: newStatus } : product
      )
    );
    toast.success(`Product status updated to ${newStatus}!`);
  };

  const handleAppeal = () => {
    toast.success('Account reactivated successfully! Your products are now visible again.');
  };

  // Rewards System Handlers
  const handleRedeemReward = (reward: any) => {
    if (currentIskoins >= reward.cost) {
      // Deduct Iskoins
      const newIskoins = currentIskoins - reward.cost;
      setCurrentIskoins(newIskoins);
      setIskoinChange(-reward.cost);
      
      // Reset change indicator after animation
      setTimeout(() => setIskoinChange(undefined), 2500);

      // Create active reward
      const activatedReward: ActiveReward = {
        id: `reward-${Date.now()}`,
        rewardId: reward.id,
        emoji: reward.emoji,
        title: reward.title,
        activatedAt: new Date(),
        expiresAt: getRewardExpiry(reward.id),
        status: 'active'
      };
      setActiveRewards(prev => [...prev, activatedReward]);

      // Show notification
      const notification: RewardNotification = {
        id: `notif-${Date.now()}`,
        type: 'activated',
        emoji: reward.emoji,
        title: reward.title,
        description: reward.description,
        iskoinCost: reward.cost,
        expiryText: getExpiryText(reward.id)
      };
      setRewardNotifications(prev => [...prev, notification]);

      // Close modal
      setShowRewardChest(false);
    } else {
      const notification: RewardNotification = {
        id: `notif-${Date.now()}`,
        type: 'failed',
        emoji: '⚠️',
        title: 'Insufficient Iskoins',
        description: `You need ${reward.cost - currentIskoins} more Iskoins`,
        iskoinCost: 0,
        expiryText: ''
      };
      setRewardNotifications(prev => [...prev, notification]);
    }
  };

  const handleExtendReward = (reward: ActiveReward) => {
    const rewardCosts: Record<string, number> = {
      'profile-frame': 4, 'post-bump': 3,
      'shout-out': 25, 'glow-name': 20, 'product-slot': 2,
      'speed-chat': 4, 'theme-customizer': 5
    };
    const cost = Math.ceil((rewardCosts[reward.rewardId] || 0) / 2);
    
    if (currentIskoins >= cost) {
      setCurrentIskoins(prev => prev - cost);
      setIskoinChange(-cost);
      setTimeout(() => setIskoinChange(undefined), 2500);

      // Extend expiry by half the original duration
      setActiveRewards(prev => prev.map(r => {
        if (r.id === reward.id) {
          const currentExpiry = new Date(r.expiresAt);
          const duration = getRewardDuration(reward.rewardId);
          const extensionTime = duration / 2;
          return {
            ...r,
            expiresAt: new Date(currentExpiry.getTime() + extensionTime)
          };
        }
        return r;
      }));

      const notification: RewardNotification = {
        id: `notif-${Date.now()}`,
        type: 'extended',
        emoji: reward.emoji,
        title: reward.title,
        description: 'Extended by 50% duration',
        iskoinCost: cost,
        expiryText: 'Check Active Rewards'
      };
      setRewardNotifications(prev => [...prev, notification]);
    }
  };

  const handleRenewReward = (reward: ActiveReward) => {
    const rewardCosts: Record<string, number> = {
      'profile-frame': 4, 'post-bump': 3,
      'shout-out': 25, 'glow-name': 20, 'product-slot': 2,
      'speed-chat': 4, 'theme-customizer': 5
    };
    const cost = rewardCosts[reward.rewardId] || 0;
    
    if (currentIskoins >= cost) {
      setCurrentIskoins(prev => prev - cost);
      setIskoinChange(-cost);
      setTimeout(() => setIskoinChange(undefined), 2500);

      setActiveRewards(prev => prev.map(r => {
        if (r.id === reward.id) {
          return {
            ...r,
            activatedAt: new Date(),
            expiresAt: getRewardExpiry(reward.rewardId),
            status: 'active'
          };
        }
        return r;
      }));

      const notification: RewardNotification = {
        id: `notif-${Date.now()}`,
        type: 'renewed',
        emoji: reward.emoji,
        title: reward.title,
        description: 'Renewed for full duration',
        iskoinCost: cost,
        expiryText: getExpiryText(reward.rewardId)
      };
      setRewardNotifications(prev => [...prev, notification]);
    }
  };

  const getRewardDuration = (rewardId: string): number => {
    // Returns duration in milliseconds
    const durations: Record<string, number> = {
      'profile-frame': 30 * 24 * 60 * 60 * 1000, // 30 days
      'post-bump': 24 * 60 * 60 * 1000, // 24 hours
      'shout-out': 7 * 24 * 60 * 60 * 1000, // 7 days
      'glow-name': 30 * 24 * 60 * 60 * 1000, // 30 days
      'product-slot': 7 * 24 * 60 * 60 * 1000, // 7 days
      'speed-chat': 30 * 24 * 60 * 60 * 1000, // 30 days
      'theme-customizer': 90 * 24 * 60 * 60 * 1000, // 90 days
    };
    return durations[rewardId] || 24 * 60 * 60 * 1000;
  };

  const getRewardExpiry = (rewardId: string): Date => {
    const now = new Date();
    const duration = getRewardDuration(rewardId);
    return new Date(now.getTime() + duration);
  };

  const getExpiryText = (rewardId: string): string => {
    const durations: Record<string, string> = {
      'profile-frame': 'Expires in 30 days',
      'post-bump': 'Expires in 24 hours',
      'shout-out': 'Expires in 7 days',
      'glow-name': 'Expires in 30 days',
      'product-slot': 'Expires in 7 days',
      'speed-chat': 'Expires in 30 days',
      'theme-customizer': 'Expires in 90 days'
    };
    return durations[rewardId] || 'Expires soon';
  };

  const handleDismissNotification = (id: string) => {
    setRewardNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="dashboard-root space-y-6 bg-background dark:bg-[var(--dashboard-bg)]">
      {/* Inactivity Banner */}
      <InactivityBanner
        accountStatus={currentUser?.accountStatus || 'active'}
        inactiveDays={currentUser?.inactiveDays || 0}
        onAppeal={handleAppeal}
      />

      {/* User Profile Header - Modern Social Media Style */}
      <UserProfileHeader
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        currentIskoins={currentIskoins}
        userStats={userStats}
        onCreditScoreClick={() => {
          if (overlayManager && overlayManager.show) {
            overlayManager.show('creditScoreHistory', { userId: currentUser?.id });
          } else {
            setShowCreditScoreModal(true);
          }
        }}
        onIskoinClick={() => setShowDailySpin(true)}
      />

      <div>
        <h1 className="text-2xl">My Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="relative">
        {/* Noise Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.015] dark:block hidden rounded-[20px]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* Main Stats Row with Floating Icons */}
        <div className="flex items-center gap-7">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            <Card 
              className="relative cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.1)] backdrop-blur-sm"
              onClick={() => setShowTotalProductsModal(true)}
            >
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 text-primary dark:text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl mb-1">{userStats.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </CardContent>
            </Card>

            <Card 
              className="relative cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.1)] backdrop-blur-sm"
              onClick={() => setShowCompletedSalesModal(true)}
            >
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 text-accent dark:text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl mb-1">{userStats.completedSales}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card 
              className="relative cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.1)] backdrop-blur-sm"
              onClick={() => setShowRatingHistoryModal(true)}
            >
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 text-accent dark:text-amber-400 mx-auto mb-2" />
                <div className="text-2xl mb-1">{userStats.rating}</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </CardContent>
            </Card>
          </div>

          {/* Floating Feature Icons - Desktop Only */}
          <div className="hidden md:flex flex-col gap-[26px] items-center justify-center">
            <DailySpinCard
              spinsLeft={dailySpinState.spinsLeft}
              rechargesLeft={dailySpinState.rechargesLeft}
              onClick={() => setShowDailySpin(true)}
            />
            <SeasonAnnouncementCard
              currentSeason={currentSeason}
              onClick={() => setShowSeasonResetPopup(true)}
            />
          </div>
        </div>

        {/* Floating Feature Icons - Mobile (Below Stats) */}
        <div className="md:hidden flex gap-[26px] items-center justify-center mt-4">
          <DailySpinCard
            spinsLeft={dailySpinState.spinsLeft}
            rechargesLeft={dailySpinState.rechargesLeft}
            onClick={() => setShowDailySpin(true)}
          />
          <SeasonAnnouncementCard
            currentSeason={currentSeason}
            onClick={() => setShowSeasonResetPopup(true)}
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full gap-2 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/30 dark:to-[#021223]/50 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] p-1.5 dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] backdrop-blur-sm">
          <TabsTrigger 
            value="listings"
            className="flex-1 text-center rounded-[16px] data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
          >
            My Products
          </TabsTrigger>
          <TabsTrigger 
            value="messages"
            className="flex-1 text-center rounded-[16px] data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
          >
            Messages
          </TabsTrigger>
          <TabsTrigger 
            value="reviews"
            className="flex-1 text-center rounded-[16px] data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
          >
            Reviews
          </TabsTrigger>
          <TabsTrigger 
            value="rewards"
            className="flex-1 text-center rounded-[16px] data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(52,211,153,0.3)] transition-all duration-300"
          >
            Rewards
          </TabsTrigger>

        </TabsList>

        <TabsContent value="listings" className="space-y-4 relative">
          {/* Noise Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.015] dark:block hidden rounded-[20px]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              mixBlendMode: 'overlay'
            }}
          />
          
          {productsLoading ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center max-w-md">
                <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Loading your products...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we fetch your listings.
                </p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center max-w-md">
                <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No products listed at the moment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start selling by posting your first product listing.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 relative z-10">
              {products.map(product => {
                const status = product.status ?? 'available';
                return (
                <Card 
                  key={product.id} 
                  className="hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <ImageWithFallback
                          src={getPrimaryImage(product)}
                          alt={product.title}
                          className="w-16 h-16 object-contain bg-white dark:bg-[var(--card)] p-1 rounded-[12px] flex-shrink-0 shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{product.title}</h3>
                          <div className="text-lg text-emerald-600 dark:text-emerald-400">{formatPrice(product.price)}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>Posted {new Date(product.datePosted).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end space-x-2 flex-shrink-0">
                        <Select
                          value={status}
                          onValueChange={(value) => handleStatusChange(product.id, value)}
                        >
                          <SelectTrigger className="w-32 h-9 rounded-full border-[#14b8a6]/30 dark:border-[#14b8a6]/20">
                            <SelectValue>
                              <Badge className={getStatusColor(status)}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-emerald-500/10 dark:hover:bg-emerald-400/10 p-2 flex-shrink-0 rounded-full transition-all duration-200 hover:shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                          onClick={() => handleEditProduct(product)}
                          title="Edit product"
                        >
                          <Edit2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 flex-shrink-0 rounded-full transition-all duration-200"
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </TabsContent>



        <TabsContent value="messages" className="space-y-4 relative">
          {/* Noise Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.015] dark:block hidden rounded-[20px]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              mixBlendMode: 'overlay'
            }}
          />
          
          {chatLoading ? (
            <div className="relative z-10 flex items-center justify-center py-16">
              <div className="animate-spin">
                <MessageCircle className="h-8 w-8 text-accent/50" />
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center max-w-md">
                <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No messages at the moment
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Messages from interested buyers will appear here.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => chatContext.refreshConversations()}
                  className="mx-auto"
                >
                  Refresh
                </Button>
              </div>

            </div>
          ) : (
            <div className="grid gap-4 relative z-10">
              {conversations.map(conversation => {
                const hasUnread = (conversation.unread_count || 0) > 0;
                
                return (
                  <Card 
                    key={conversation.conversation_id} 
                    className={`hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 rounded-[20px] backdrop-blur-sm border border-gray-200/50 dark:border-[#14b8a6]/20 cursor-pointer ${
                      hasUnread 
                        ? 'ring-2 ring-emerald-400/50 dark:ring-emerald-600/50 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60'
                        : 'bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60'
                    }`}
                    onClick={() => handleReply(conversation)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-accent/20 text-accent-foreground">
                            {conversation.other_user_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h3 className="font-medium truncate">{conversation.other_user_name || 'Unknown User'}</h3>
                            </div>
                            <span className="text-sm text-muted-foreground flex-shrink-0">
                              {conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {hasUnread && (
                              <Badge className="bg-accent/20 text-accent-foreground">
                                {conversation.unread_count} New
                              </Badge>
                            )}
                            {conversation.product_title && (
                              <span className="text-xs text-muted-foreground truncate">
                                About: {conversation.product_title}
                              </span>
                            )}
                          </div>
                          {conversation.last_message && (
                            <p className="text-sm text-muted-foreground mt-2 truncate">
                              {conversation.last_message}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-emerald-500/10 dark:hover:bg-emerald-400/10 rounded-full transition-all duration-200 hover:shadow-[0_0_12px_rgba(52,211,153,0.3)] border-[#14b8a6]/30 flex-shrink-0"
                          title="Reply to message"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReply(conversation);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 relative">
          {/* Noise Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.015] dark:block hidden rounded-[20px]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              mixBlendMode: 'overlay'
            }}
          />
          
          {reviews.length === 0 ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center max-w-md">
                <Star className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No reviews at the moment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Reviews from completed transactions will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 relative z-10">
              {reviews.map(review => (
                <Card 
                  key={review.id} 
                  className="hover:shadow-[0_0_0_1px_rgba(20,184,166,0.2),0_8px_24px_rgba(20,184,166,0.15)] dark:shadow-[0_0_20px_rgba(20,184,166,0.08)] transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50 dark:from-[#003726]/40 dark:to-[#021223]/60 border border-gray-200/50 dark:border-[#14b8a6]/20 rounded-[20px] backdrop-blur-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-accent/20 text-accent-foreground">
                          {review.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{review.from}</h3>
                          <span className="text-sm text-muted-foreground">{new Date(review.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-accent fill-current' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6 relative">
          {/* Noise Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.015] dark:block hidden rounded-[20px]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              mixBlendMode: 'overlay'
            }}
          />
          {/* Redeem Button */}
          <div className="bg-[#EDF7EE] dark:bg-gradient-to-br dark:from-[#001827] dark:to-[#002434] border border-[#DCE8DE] dark:border-emerald-500/30 rounded-[24px] p-6 shadow-[0_6px_16px_rgba(0,150,90,0.10)] dark:shadow-[inset_0_1px_0_0_rgba(20,184,166,0.1),0_4px_16px_rgba(0,24,39,0.3)] backdrop-blur-sm mb-7">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl text-[#006400] dark:text-emerald-300 font-semibold">Your Rewards</h3>
                <p className="text-sm text-[#006400]/70 dark:text-emerald-400/60 mt-1">
                  Redeem exclusive features and perks using your Iskoins
                </p>
              </div>
              <div className="relative">
                {/* Off-white halo behind button */}
                <div className="absolute inset-0 bg-[#F1FAF4] dark:bg-transparent rounded-[32px] blur-sm"></div>
                <Button
                  onClick={() => setShowRewardChest(true)}
                  className="relative rounded-[32px] bg-gradient-to-r from-[#17D1A1] to-[#0FBF74] dark:from-green-400 dark:via-cyan-400 dark:to-emerald-400 border-0 dark:border-2 dark:border-cyan-300/50 text-white px-6 py-2.5 hover:from-[#14C094] hover:to-[#0DAD68] dark:hover:from-green-500 dark:hover:via-cyan-500 dark:hover:to-emerald-500 hover:scale-[1.05] shadow-[0_8px_20px_rgba(28,181,120,0.25)] dark:shadow-[0_0_25px_rgba(34,211,238,0.6),0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-sm transition-all duration-300 tracking-wide"
                >
                  <motion.span 
                    className="mr-2 text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    animate={{
                      rotateY: [0, 360]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    💎
                  </motion.span>
                  <span className="font-medium">Redeem Rewards</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Active Rewards Tracker */}
          <ActiveRewardsTracker
            activeRewards={activeRewards}
            userIskoins={currentIskoins}
            onExtend={handleExtendReward}
            onRenew={handleRenewReward}
          />
        </TabsContent>


      </Tabs>

      {/* Chat Modal */}
      {showChat && selectedMessage && currentUser && (
        <ChatModal
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setSelectedMessage(null);
          }}
          currentUser={currentUser}
          otherUser={selectedMessage.otherUser || {
            id: selectedMessage.id,
            name: selectedMessage.name,
            avatar: selectedMessage.avatar,
            program: selectedMessage.program || "BS Computer Science"
          }}
          product={selectedMessage.productId ? {
            id: selectedMessage.productId,
            title: selectedMessage.product || "Product",
            price: 0,
            image: ""
          } : undefined}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditListingModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          listing={editingProduct}
          onUpdateListing={handleUpdateProduct}
        />
      )}

      {/* Credit Score: prefer screen-level overlay via OverlayManager; keep nested modal as fallback for environments without it. */}
      {(!(() => { try { require('../contexts/OverlayManager'); return true; } catch { return false; } })()) && (
        <CreditScoreModal
          isOpen={showCreditScoreModal}
          onClose={() => setShowCreditScoreModal(false)}
          currentScore={currentUser?.creditScore || 100}
          history={creditHistory}
          loading={creditHistoryLoading}
        />
      )}

      {/* Dashboard Stats Modals */}
      <TotalProductsModal
        isOpen={showTotalProductsModal}
        onClose={() => setShowTotalProductsModal(false)}
        products={products}
      />



      <CompletedSalesModal
        isOpen={showCompletedSalesModal}
        onClose={() => setShowCompletedSalesModal(false)}
        completedCount={userStats.completedSales}
      />

      <RatingHistoryModal
        isOpen={showRatingHistoryModal}
        onClose={() => setShowRatingHistoryModal(false)}
        rating={userStats.rating}
        totalRatings={userStats.totalRatings}
        reviews={reviews}
      />

      {/* Season Reset Popup */}
      <SeasonResetPopup
        isOpen={showSeasonResetPopup}
        onClose={() => setShowSeasonResetPopup(false)}
        previousScore={currentUser?.creditScore || 70}
        newScore={calculateSeasonResetScore(currentUser?.creditScore || 70)}
        season={currentSeason}
        iskoinsLocked={iskoinsLocked}
        totalIskoins={userIskoins}
      />

      {/* Full Season Stats Modal removed */}

      {/* Reward Chest Modal */}
      <RewardChestModal
        isOpen={showRewardChest}
        onClose={() => setShowRewardChest(false)}
        userIskoins={currentIskoins}
        onRedeem={handleRedeemReward}
        onIskoinChange={(amount) => {
          const newIskoins = currentIskoins + amount;
          setCurrentIskoins(newIskoins);
          setIskoinChange(amount);
          setTimeout(() => setIskoinChange(undefined), 2500);
        }}
        userCreditScore={currentUser?.creditScore || 70}
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
      />

      {/* Daily Spin Modal (Elite Only) */}
      <DailySpinModal
        isOpen={showDailySpin}
        onClose={() => setShowDailySpin(false)}
        currentIskoins={currentIskoins}
        userCreditScore={currentUser?.creditScore || 70}
        onSpinComplete={(iskoins) => {
          const newIskoins = currentIskoins + iskoins;
          setCurrentIskoins(newIskoins);
          setIskoinChange(iskoins);
          setTimeout(() => setIskoinChange(undefined), 2500);
          
          // Update daily spin state
          if (iskoins >= 0) {
            setDailySpinState(prev => ({
              ...prev,
              spinsLeft: prev.spinsLeft > 0 ? prev.spinsLeft - 1 : 0
            }));
          } else {
            // Recharge used
            setDailySpinState(prev => ({
              spinsLeft: prev.spinsLeft + 1,
              rechargesLeft: prev.rechargesLeft > 0 ? prev.rechargesLeft - 1 : 0
            }));
          }
        }}
      />

      {/* Floating Daily Spin Widget */}
      {/* REMOVED - Now displayed as a card in the stats overview */}
      {/* <FloatingDailySpinWidget
        spinsLeft={dailySpinState.spinsLeft}
        rechargesLeft={dailySpinState.rechargesLeft}
        onClick={() => setShowDailySpin(true)}
        userCreditScore={currentUser?.creditScore || 70}
      /> */}

      {/* Reward Activation Popups */}
      <RewardActivationPopup
        notifications={rewardNotifications}
        onDismiss={handleDismissNotification}
        onOpenTracker={() => setActiveTab('rewards')}
      />

      {/* Iskoin Meter Widget - REMOVED */}
      {/* <IskoinMeterWidget
        iskoins={currentIskoins}
        onChange={iskoinChange}
        onClick={() => setShowRewardChest(true)}
      /> */}
    </div>
  );
}