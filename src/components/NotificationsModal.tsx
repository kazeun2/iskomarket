/**
 * Notifications Modal Component
 * Last Updated: December 13, 2025
 * 
 * Handles all notification types including messages, system alerts, reports, and appeals.
 * Integrates with Supabase for real-time notification updates.
 */

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { NotificationTabs } from "./NotificationTabs";
import { NotificationCard } from "./NotificationCard";
import { ChatModal } from "./ChatModal";
import { SystemAnnouncementModal } from "./SystemAnnouncementModal";
import { ReportDetailsModal } from "./ReportDetailsModal";
import { WarningModal } from "./WarningModal";
import { AppealStatusModal, AppealData } from "./AppealStatusModal";
import { AccountDeletionAppealModal } from "./AccountDeletionAppealModal";
import { ActivityDetailModal, ActivityDetail } from "./ActivityDetailModal";
import { isExampleMode } from "../utils/exampleMode";
import { formatNotificationTime } from "../utils/timeUtils";
import {
  getUserNotifications,
  markNotificationAsRead,
  subscribeToNotifications,
  Notification as SupabaseNotification,
} from "../lib/services/notifications";
import { getProduct } from "../lib/services/products";
import { useAuth } from "../contexts/AuthContext";

export type NotificationType = "message" | "system" | "report" | "warning" | "transaction" | "appeal" | "announcement" | "admin";
export type NotificationFilter = "all" | "unread" | "messages" | "system" | "reports" | "appeals";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  emoji?: string;
  isUnread: boolean;
  appealData?: AppealData;
  activityData?: ActivityDetail;
  createdAt?: Date;
  urgencyLevel?: number;
  product?: any; // Product data for message notifications
  otherUser?: any; // Other user data for message notifications
  recipientId?: number; // Recipient ID for chat
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onUnreadCountChange?: (count: number) => void;
}

// Convert Supabase notification to local notification format
function convertSupabaseNotification(supabaseNotif: SupabaseNotification): Notification {
  return {
    id: supabaseNotif.id,
    type: supabaseNotif.type as NotificationType,
    title: supabaseNotif.title,
    description: supabaseNotif.message,
    timestamp: formatNotificationTime(supabaseNotif.created_at),
    isUnread: !supabaseNotif.is_read,
    createdAt: new Date(supabaseNotif.created_at),
    urgencyLevel: 2,
  };
}

// Enrich notification with product data (for message notifications)
async function enrichNotificationWithProductData(notification: Notification): Promise<Notification> {
  // Only enrich message notifications that have a related_id
  if (notification.type !== 'message') {
    return notification;
  }

  // For production: Parse related_id to get product_id and sender_id
  // Format: "product_id:sender_id" or just "product_id"
  // This is a placeholder - actual implementation depends on how related_id is stored
  // Example: If related_id = "product-123:user-456"
  
  try {
    // TODO: Implement actual product data fetching when Supabase notifications
    // include related_id with product information
    // const productId = extractProductIdFromRelatedId(notification.related_id);
    // const productData = await getProduct(productId);
    // notification.product = productData;
    // notification.otherUser = productData.seller;
    
    return notification;
  } catch (error) {
    console.error('Error enriching notification with product data:', error);
    return notification;
  }
}

// Example data for testing accounts
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "message",
    title: "New message from ZPK Sisters",
    description: "Hi! Is this still available?",
    timestamp: "5m ago",
    isUnread: true,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    urgencyLevel: 2,
    product: {
      id: 1,
      title: "CvSU Merch Bundle",
      price: 350,
      image: "https://images.unsplash.com/photo-1620799140188-3b2a7c2e0e12?w=400",
      description: "Official CvSU merchandise bundle including shirt and accessories",
      category: "Apparel",
      condition: "Brand New",
      meetupLocation: "U-Mall Gate",
      postedDate: "2025-12-10T10:00:00Z",
      views: 45,
      rating: 4.8,
      reviewCount: 12,
      seller: {
        id: 100,
        name: "ZPK Sisters",
        username: "zpksisters",
        avatar: null,
        creditScore: 92,
        program: "BS Business Management",
        yearLevel: "3rd Year",
        isTopBuyer: false,
        totalSales: 23,
        joinedDate: "August 2024",
      },
    },
    otherUser: {
      id: 100,
      name: "ZPK Sisters",
      username: "zpksisters",
      avatar: null,
      creditScore: 92,
      program: "BS Business Management",
      yearLevel: "3rd Year",
    },
    recipientId: 100,
  },
  {
    id: "2",
    type: "system",
    title: "System Alert: Scheduled Maintenance",
    description: "IskoMarket will undergo maintenance soon.",
    timestamp: "1h ago",
    isUnread: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    urgencyLevel: 3,
  },
  {
    id: "3",
    type: "report",
    title: "Report Update",
    description: "Your submitted report has been reviewed.",
    timestamp: "3h ago",
    isUnread: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    urgencyLevel: 1,
  },
  {
    id: "4",
    type: "warning",
    title: "Warning Issued",
    description: "One of your listings violated posting guidelines.",
    timestamp: "1d ago",
    isUnread: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    urgencyLevel: 3,
  },
];

export function NotificationsModal({ 
  isOpen, 
  onClose, 
  currentUser,
  onUnreadCountChange 
}: NotificationsModalProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [subModalType, setSubModalType] = useState<NotificationType | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isExample = isExampleMode(currentUser);

  // Ensure body reflects modal state so light-mode overrides apply
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  // Load notifications from Supabase
  useEffect(() => {
    if (!isOpen) return; 

    const loadNotifications = async () => {
      if (isExample) {
        // Use mock data for example accounts
        setNotifications(mockNotifications);
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabaseNotifs = await getUserNotifications(user.id);
        const converted = supabaseNotifs.map(convertSupabaseNotification);
        setNotifications(converted);
      } catch (error) {
        console.error("Error loading notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [isOpen, user?.id, isExample]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (isExample || !user?.id) return;

    const unsubscribe = subscribeToNotifications(
      user.id,
      (newNotification) => {
        // Add new notification to the list
        const converted = convertSupabaseNotification(newNotification);
        setNotifications((prev) => [converted, ...prev]);

        // Scroll to top when new notification arrives
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      },
      (updatedNotification) => {
        // Update existing notification
        const converted = convertSupabaseNotification(updatedNotification);
        setNotifications((prev) =>
          prev.map((n) => (n.id === converted.id ? converted : n))
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, isExample]);

  // Calculate counts for tabs
  const unreadCount = notifications.filter((n) => n.isUnread).length;
  const messagesCount = notifications.filter((n) => n.type === "message" && n.isUnread).length;
  const systemCount = notifications.filter((n) => 
    (n.type === "system" || n.type === "announcement" || n.type === "admin") && n.isUnread
  ).length;
  const reportsCount = notifications.filter((n) => n.type === "report" && n.isUnread).length;
  const appealsCount = notifications.filter((n) => n.type === "appeal" && n.isUnread).length;

  // Notify parent of unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return notification.isUnread;
    if (activeFilter === "messages") return notification.type === "message";
    if (activeFilter === "system") return ["system", "announcement", "admin"].includes(notification.type);
    if (activeFilter === "reports") return notification.type === "report";
    if (activeFilter === "appeals") return notification.type === "appeal";
    return true;
  });

  // Reset scroll position when changing tabs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeFilter]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (notification.isUnread && !isExample && user?.id) {
      try {
        await markNotificationAsRead(notification.id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isUnread: false } : n
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Open appropriate modal
    setSelectedNotification(notification);
    setSubModalType(notification.type);
  };

  const handleCloseSubModal = () => {
    setSubModalType(null);
    setSelectedNotification(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[100] transition-opacity pointer-events-none"
      />

      {/* Modal container - FIXED SIZE */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--card)] dark:bg-[var(--card)] rounded-[24px] shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-[calc(100%-32px)] md:max-w-[540px] lg:max-w-[600px] h-[90vh] max-h-[700px] flex flex-col pointer-events-auto border border-gray-200 dark:border-gray-200 dark:backdrop-blur-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - sticky */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-green-900/20 bg-[var(--card)] dark:bg-gradient-to-r dark:from-[#1a2f1a]/90 dark:via-[#1a2317]/90 dark:to-[#1a1f1a]/90 dark:backdrop-blur-sm flex-shrink-0">
            <h2 className="text-[22px] md:text-[24px] dark:text-white">Notifications</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors text-green-600 dark:text-green-500"
              aria-label="Close notifications"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-green-900/20 bg-[var(--card)] dark:bg-gradient-to-r dark:from-[#1a2f1a]/50 dark:via-[#1a2317]/50 dark:to-[#1a1f1a]/50 flex-shrink-0">
            <NotificationTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              unreadCount={unreadCount}
              messagesCount={messagesCount}
              systemCount={systemCount}
              reportsCount={reportsCount}
              appealsCount={appealsCount}
            />
          </div>

          {/* Notifications list - SCROLLABLE WITH FIXED HEIGHT */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
            style={{
              scrollBehavior: 'smooth'
            }}
          >
            {loading ? (
              // Loading state
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-gray-900 dark:text-white mb-2">
                  Loading notifications...
                </h3>
              </div>
            ) : filteredNotifications.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-gray-900 dark:text-white mb-2">
                  You're all caught up!
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No new notifications right now.
                </p>
              </div>
            ) : (
              <div className="px-5 py-3 space-y-3">
                {filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {subModalType === "message" && (
        <ChatModal
          isOpen={true}
          onClose={handleCloseSubModal}
          recipient={selectedNotification?.title.replace("New message from ", "").replace("New Message from ", "") || ""}
          currentUser={currentUser}
          otherUser={selectedNotification?.otherUser}
          contactId={selectedNotification?.recipientId}
          product={selectedNotification?.product}
          zIndex={9999}
        />
      )}

      {subModalType === "system" && (
        <SystemAnnouncementModal
          isOpen={true}
          onClose={handleCloseSubModal}
          announcement={selectedNotification || null}
        />
      )}

      {subModalType === "report" && (
        <ReportDetailsModal
          isOpen={true}
          onClose={handleCloseSubModal}
          report={selectedNotification || null}
        />
      )}

      {subModalType === "warning" && (
        <WarningModal
          isOpen={true}
          onClose={handleCloseSubModal}
          warning={selectedNotification || null}
        />
      )}

      {subModalType === "transaction" && (
        <ActivityDetailModal
          isOpen={true}
          onClose={handleCloseSubModal}
          activity={selectedNotification?.activityData || null}
        />
      )}

      {subModalType === "appeal" && (
        <AppealStatusModal
          isOpen={true}
          onClose={handleCloseSubModal}
          appealData={selectedNotification?.appealData || null}
        />
      )}

      {/* Account Deletion Appeal Modal */}
      {selectedNotification?.title === "⚠️ Account Deletion Notice" && subModalType === "warning" && (
        <AccountDeletionAppealModal
          isOpen={true}
          onClose={handleCloseSubModal}
          deletionReason="Violated marketplace rules"
          adminNote="Posted prohibited items multiple times despite warnings."
          daysRemaining={30}
        />
      )}
    </>
  );
}