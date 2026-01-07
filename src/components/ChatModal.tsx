/**
 * Chat Modal Component
 * Last Updated: December 13, 2025
 * 
 * Handles all chat interactions including:
 * - Product-based conversations
 * - Message alignment (product card from current user on RIGHT, other user's messages on LEFT)
 * - Transaction scheduling and confirmation flows
 * - Real-time messaging via Supabase
 */
// Supabase client is accessed via services; do not import it directly here
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  Calendar,
  Check,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getPrimaryImage } from "../utils/images";
import { PriorityBadge, isTopFiveBuyer } from "./PriorityBadge";
import { toast } from "sonner";
import { DatePickerModal } from "./DatePickerModal";
import { RateThisUserModal } from "./RateThisUserModal";
import { ProductDetail } from "./ProductDetail";
import { UsernameWithGlow } from "./UsernameWithGlow";
import { getCollegeFrameStyles } from "./CollegeFrameBackground";
import {
  formatOnlineStatus,
  formatRelativeTime,
} from "../utils/timeUtils";
import {
  getUserOnlineStatus,
  sendMessage,
  getMessages,
  markAsRead,
  subscribeToMessages,
  updateUserActivity,
  getOrCreateConversation,
  findConversationBetween,
} from "../services/messageService";
import { useAuth } from "../contexts/AuthContext";
import { useChatOptional } from "../contexts/ChatContext";

interface Message {
  id: string;
  message?: string;
  message_text?: string;
  content?: string;
  sender_id?: string;
  receiver_id?: string;
  timestamp: string;
  type?: "text" | "product";
  created_at: string;
  is_read: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  otherUser?: any;
  recipient?: string;
  contactId?: number;
  isPriorityBuyer?: boolean;
  zIndex?: number;
  product?: {
    id: number;
    title: string;
    price: number;
    image?: string;
    images?: string[];
    description?: string;
    category?: string;
    condition?: string;
    meetupLocation?: string;
    postedDate?: string;
    views?: number;
    rating?: number;
    reviewCount?: number;
    seller?: any;
    isNegotiable?: boolean;
    stock?: number;
    tags?: string[];
    deliveryOptions?: string[];
  };
  onRequestEdit?: (product: any) => void;
}

interface Transaction {
  id?: number;
  meetupDate?: Date; // Store as Date object for easier calculations
  meetupLocation?: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  status:
    | "pending"
    | "proposed" // Date selected, awaiting confirmation
    | "scheduled" // Confirmed, countdown to meetup
    | "meetup_day_passed" // 7-day window to confirm completion
    | "completed"
    | "unsuccessful"
    | "appealed"; // Reopened after unsuccessful
  proposedAt?: Date; // When the date was proposed
  confirmedAt?: Date; // When the other user confirmed
  meetupDayReachedAt?: Date; // When the meetup day was reached
  unsuccessfulAt?: Date; // When marked unsuccessful
  userCompletedConfirmation?: boolean; // Current user clicked Completed
  otherUserCompletedConfirmation?: boolean; // Other user clicked Completed
  userAppealed?: boolean; // Current user clicked Appeal
  otherUserAppealed?: boolean; // Other user clicked Appeal
}

export function ChatModal({
  isOpen,
  onClose,
  currentUser,
  otherUser,
  recipient,
  contactId = 1,
  isPriorityBuyer: priorityBuyerProp,
  product,
  onRequestEdit,
  zIndex = 9999,
}: ChatModalProps) {
  const { user } = useAuth(); // Get authenticated user
  const chatContext = useChatOptional(); // Get chat context for refreshing conversations
  // Start with any already-known user id to avoid temporary nulls
  const [authUserId, setAuthUserId] = useState<string | null>(user?.id ?? null);

  useEffect(() => {
    let mounted = true;
    let listener: any = null;

    (async () => {
      try {
        const { supabase } = await import('../lib/supabase');

        // Initial authoritative fetch
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        const id = (data as any)?.user?.id ?? user?.id ?? null;
        setAuthUserId(id);
        console.log('ChatModal: auth session user id:', id);

        // Subscribe to auth state changes so we stay in sync
        const res = supabase.auth.onAuthStateChange((_event: any, session: any) => {
          if (!mounted) return;
          const id2 = session?.user?.id ?? user?.id ?? null;
          setAuthUserId(id2);
          console.log('ChatModal: auth state changed, user id:', id2);
        });

        listener = res?.data?.subscription;
      } catch (e) {
        console.warn('ChatModal: failed to get auth user', e);
      }
    })();

    return () => {
      mounted = false;
      if (listener?.unsubscribe) listener.unsubscribe();
    };
  }, [user?.id]);
  const [newMessage, setNewMessage] = useState("");
  const [isMarkedAsDone, setIsMarkedAsDone] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showStatusBanner, setShowStatusBanner] =
    useState(false);
  const [statusBannerMessage, setStatusBannerMessage] =
    useState("");
  const [statusBannerType, setStatusBannerType] = useState<
    "success" | "info" | "error"
  >("info");
  const [
    selectedProductForDetail,
    setSelectedProductForDetail,
  ] = useState<any>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [showTypingIndicator, setShowTypingIndicator] =
    useState(false);
  const [isSending, setIsSending] = useState(false); // Prevent duplicate sends
  const [isLoadingMessages, setIsLoadingMessages] =
    useState(true); // Loading state
  const [transaction, setTransaction] = useState<Transaction>({
    buyerConfirmed: false,
    sellerConfirmed: false,
    status: "pending",
    meetupLocation: "U-Mall Gate", // Updated default location
  });

  // Online status state
  const [onlineStatus, setOnlineStatus] = useState<{
    isOnline: boolean;
    statusText: string;
  }>({
    isOnline: false,
    statusText: "Checking status...",
  });

  // Determine the recipient name
  const recipientName =
    otherUser?.name ||
    otherUser?.username ||
    recipient ||
    "User";
  const recipientId = otherUser?.id || contactId;

  // Safely convert recipientId to string
  const recipientIdStr = recipientId ? String(recipientId) : undefined;

  // Get current user ID for message comparison (prefer auth session id)
  const currentUserId = React.useMemo(() => authUserId ?? user?.id ?? currentUser?.id ?? undefined, [authUserId, user?.id, currentUser?.id]);

  // Stable values used in effects to avoid potential parsing of optional chaining in dependency arrays
  const userIdForMessages = user?.id ?? currentUserId ?? undefined;
  const productIdForMessages = product?.id ?? undefined;

  // Helper to resolve seller id for product (avoid falling back to currentUser unexpectedly)
  const resolveProductSellerId = (p: any, fallbackToRecipient = true) => {
    if (!p) return undefined;
    if (p.seller && p.seller.id) return p.seller.id;
    if ((p as any).seller_id) return (p as any).seller_id;
    // Fallback: prefer recipient (assume product may belong to other user in the conversation)
    if (fallbackToRecipient && recipientIdStr) return recipientIdStr;
    return undefined;
  };
  
  // Debug logging
  console.log('ChatModal currentUserId:', { currentUserId, authUserId, userExists: !!user, 'user.id': user?.id, currentUserExists: !!currentUser, 'currentUser.id': currentUser?.id });

  // Start with only product card (NO auto-welcome message yet)
  // When opened from notifications, product card should be right-aligned (MY product)
  // Product card message: only attach a sender_id if product seller is known; otherwise render centered product card
  const initialMessages: Message[] = product
    ? [
        {
          id: "product-card",
          // Use explicit seller id when available; do NOT fall back to recipient (avoids mis-attribution)
          sender_id: resolveProductSellerId(product, false) ?? undefined,
          receiver_id: recipientIdStr ?? undefined,
          timestamp: "6:10 PM",
          type: "product",
          created_at: "2023-10-01T18:10:00Z",
          is_read: false,
        },
      ]
    : [];

  const [messages, setMessages] =
    useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bannerTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: 'end',
    });
  }, [messages]);

  const [conversationId, setConversationId] = useState<string | null>(null);

  // Load messages from Supabase when modal opens and resolve or create a conversation
  useEffect(() => {
    if (!isOpen || !currentUserId || !recipientId) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);

      // Ensure recipientId is a string for API calls
      const recipientIdStr = String(recipientId);

      console.log('[ChatModal] Starting message load:', {
        currentUserId,
        recipientIdStr,
        productId: product?.id,
      });

      // Resolve conversation id: prefer product-based conversation if product exists
      let convId: string | null = null;
      try {
        if (product?.id) {
          convId = await getOrCreateConversation(product.id.toString(), currentUserId, recipientIdStr);
        } else {
          convId = await findConversationBetween(currentUserId, recipientIdStr);
        }
      } catch (err) {
        console.warn('[ChatModal] Error resolving conversation id:', err);
      }

      // CRITICAL SECURITY: conversation_id is REQUIRED before loading any messages
      // Without it, we risk leaking messages across conversations
      if (!convId) {
        console.error('[ChatModal] Failed to resolve conversation_id - cannot safely load messages');
        setIsLoadingMessages(false);
        toast.error('Unable to establish secure conversation');
        return;
      }

      console.log('[ChatModal] Resolved conversation ID:', convId);
      setConversationId(convId);

      if (!recipientIdStr) {
        console.error('[ChatModal] recipientIdStr is null, cannot load messages');
        setIsLoadingMessages(false);
        toast.error('Unable to load messages - missing recipient');
        return;
      }

      const { data, error } = await getMessages({
        user_id: currentUserId,
        other_user_id: recipientIdStr,
        conversation_id: convId,
      });

      if (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
        setIsLoadingMessages(false);
        return;
      }

      console.log('[ChatModal] Messages loaded successfully:', {
        count: data?.length ?? 0,
        conversationId: convId,
      });

      if (data && data.length > 0) {
        // Convert Supabase messages to UI format
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          message: msg.message || (msg as any).message_text || (msg as any).content || '(No text)',
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          timestamp: formatRelativeTime(msg.created_at),
          type: 'text',
          created_at: msg.created_at,
          is_read: msg.is_read,
        }));

        // Insert product card at top if needed
        if (product && !formattedMessages.some((m) => m.type === 'product')) {
          formattedMessages.unshift({
            id: 'product-card',
            message: undefined as any,
            // don't fall back to recipient for seller
            sender_id: resolveProductSellerId(product, false) ?? undefined,
            receiver_id: recipientIdStr ?? undefined,
            timestamp: formatRelativeTime(product.postedDate || new Date().toISOString()),
            type: 'product',
            created_at: product.postedDate || new Date().toISOString(),
            is_read: true,
          });
        }

        // Deduplicate messages by id to prevent React key collisions
        const uniqueMessages = Array.from(
          new Map(formattedMessages.map((m) => [m.id, m])).values(),
        );
        setMessages(uniqueMessages);
        setIsFirstMessage(
          uniqueMessages.filter((m) => m.type === 'text').length === 0,
        );
      } else {
        // No messages yet, just show product card if available (ensure dedupe)
        const uniqueInitial = Array.from(new Map(initialMessages.map((m) => [m.id, m])).values());
        setMessages(uniqueInitial);
      }

      setIsLoadingMessages(false);

      // Mark messages as read (use resolved conversation id when available)
      try {
        await markAsRead({
          // Use the resolved session/current id rather than directly referencing `user.id` which can be null in some contexts
          user_id: currentUserId ?? undefined,
          // Prefer the locally-resolved conversation id (convId) to avoid race conditions
          conversation_id: convId ?? conversationId ?? undefined,
          sender_id: recipientIdStr ?? undefined,
        });
      } catch (e) {
        console.warn('[ChatModal] markAsRead failed:', e);
      }
    };

      loadMessages();
  }, [isOpen, userIdForMessages, recipientId, productIdForMessages]);

  // Subscribe to real-time messages (by conversation when available)
  useEffect(() => {
    if (!isOpen || !currentUserId || !recipientIdStr) return;

    // Subscribe using conversation_id when available, otherwise fall back to participant-based subscription.
    // This ensures we receive messages even if the conversation hasn't been created yet on the DB.
    const unsubscribe = subscribeToMessages(
      {
        user_id: currentUserId,
        other_user_id: recipientIdStr,
        conversation_id: conversationId || undefined,
      },
      (newMsg: any) => {
        console.debug('[ChatModal] Realtime message payload (conversation/participants):', newMsg);

        const formattedMessage: Message = {
          id: newMsg.id,
          message: newMsg.message || newMsg.message_text || newMsg.content || '',
          sender_id: newMsg.sender_id,
          receiver_id: newMsg.receiver_id,
          timestamp: formatRelativeTime(newMsg.created_at),
          type: 'text',
          created_at: newMsg.created_at,
          is_read: newMsg.is_read,
        };

        setMessages((prev) => {
          const combined = prev.some((m) => m.id === formattedMessage.id) ? prev : [...prev, formattedMessage];
          // Deduplicate by id to ensure no duplicate keys
          return Array.from(new Map(combined.map((m) => [m.id, m])).values());
        });

        // Mark as read immediately using conversation_id for precision if we have one
        if (conversationId) {
          markAsRead({ user_id: currentUserId, conversation_id: conversationId });
        } else {
          // Best-effort fallback: mark messages from this sender as read
          markAsRead({ user_id: currentUserId, sender_id: newMsg.sender_id });
        }

        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, conversationId, currentUserId, recipientIdStr]);

  // Update user activity when modal is open
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    // Update immediately
    updateUserActivity(currentUserId);

    // Update every 30 seconds
    const interval = setInterval(() => {
      updateUserActivity(currentUserId);
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, currentUserId]);

  // Update timestamps every 30 seconds for relative time
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => ({
          ...msg,
          timestamp: formatRelativeTime(msg.created_at),
        })),
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch and update online status
  useEffect(() => {
    if (!otherUser?.id && !recipientId) return;

    const userId = otherUser?.id || recipientId;

    // Initial fetch
    const fetchStatus = async () => {
      // If user has last_active field from database
      if (otherUser?.last_active) {
        const status = formatOnlineStatus(
          otherUser.last_active,
        );
        setOnlineStatus(status);
      } else {
        // Fetch from Supabase if not provided
        const { data, error } =
          await getUserOnlineStatus(userId);
        if (!error && data) {
          const status = formatOnlineStatus(data.last_active);
          setOnlineStatus(status);
        } else {
          // Fallback to "checking" state
          setOnlineStatus({
            isOnline: false,
            statusText: "Offline",
          });
        }
      }
    };

    fetchStatus();

    // Update every 30 seconds for real-time accuracy
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [otherUser?.id, otherUser?.last_active, recipientId]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get accurate scrollHeight
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 20; // approximate line height
      const padding = 24; // top + bottom padding (12px each)
      const minHeight = 44; // 1 line
      const maxHeight = 62; // ~3 lines for desktop

      // Calculate new height based on content, bounded by min/max
      const newHeight = Math.min(
        Math.max(scrollHeight, minHeight),
        maxHeight,
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [newMessage]);

  // Auto-dismiss banner after 5 seconds
  useEffect(() => {
    if (
      showStatusBanner &&
      statusBannerType !== "info" &&
      !transaction.meetupDate
    ) {
      bannerTimeoutRef.current = setTimeout(() => {
        setShowStatusBanner(false);
      }, 5000);

      return () => {
        if (bannerTimeoutRef.current) {
          clearTimeout(bannerTimeoutRef.current);
        }
      };
    }
  }, [
    showStatusBanner,
    statusBannerType,
    transaction.meetupDate,
  ]);

  // Chat moderation - inappropriate content detection
  const checkInappropriateContent = (text: string): boolean => {
    const profanityPatterns = [
      /\b(fuck|shit|damn|bitch|asshole|bastard)\b/gi,
      /\b(putang|gago|tanga|tarantado|buwisit|ulol|bobo|peste)\b/gi,
    ];

    const scamPatterns = [
      /\b(send money first|payment first|advance payment|gcash muna|bayad muna)\b/gi,
      /\b(wire transfer|western union|moneygram)\b/gi,
    ];

    for (const pattern of [
      ...profanityPatterns,
      ...scamPatterns,
    ]) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    if (!currentUserId || !recipientIdStr) {
      toast.error("Unable to send message - missing recipient information");
      return;
    }

    setIsSending(true);

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    // Local mutable conversation id to avoid reassigning a const from state
    let currentConversationId = conversationId;

    // Check for bad content BEFORE adding optimistic message
    if (checkInappropriateContent(messageText)) {
      toast.error(
        "Message blocked - Inappropriate content detected",
        {
          description:
            "Your credit score has been reduced by 5 points",
          duration: 5000,
        },
      );

      setIsSending(false);
      return;
    }

    // Get sender ID from the resolved current user id (session authoritative)
    const senderId = currentUserId;

    // ➤ OPTIMISTIC UI MESSAGE
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      message: messageText,
      sender_id: senderId,
      receiver_id: recipientIdStr,
      timestamp: "Just now",
      type: "text",
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Ensure we have a conversation id before sending (try resolving/creating to avoid missing conversation_id on insert)
      if (!currentConversationId) {
        try {
          console.log('[ChatModal] pre-send: resolving conversation id...');
          if (product?.id) {
            const conv = await getOrCreateConversation(product.id.toString(), senderId, recipientIdStr);
            if (conv) {
              setConversationId(conv);
              // update local mutable variable for this scope
              currentConversationId = conv;
              console.log('[ChatModal] pre-send: resolved conversation (product):', conv);
            }
          } else {
            const conv = await findConversationBetween(senderId, recipientIdStr);
            if (conv) {
              setConversationId(conv);
              currentConversationId = conv;
              console.log('[ChatModal] pre-send: resolved existing conversation between users:', conv);
            }
          }
        } catch (e) {
          console.warn('[ChatModal] pre-send conversation resolution failed (will proceed):', e);
        }
      }

      // ➤ SEND TO SUPABASE (REAL ENTRY)
      const { data, error } = await sendMessage({
        sender_id: senderId,
        receiver_id: recipientIdStr,
        product_id: product?.id?.toString(),
        conversation_id: currentConversationId ?? undefined,
        message: messageText,
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message", {
          description: error.message || "Please try again",
        });

        // Remove optimistic bubble
        setMessages((prev) => prev.filter((m) => m.id !== tempId));

        // Restore the message text to input so user can retry
        setNewMessage(messageText);

        setIsSending(false);
        return;
      }

      // If server didn't return conversation_id, try to resolve it now (may have been created during send)
      try {
        if (data && !(data as any).conversation_id) {
          try {
            console.log('[ChatModal] sendMessage returned without conversation_id - resolving now');
            const conv = await findConversationBetween(senderId, recipientIdStr);
            if (conv) {
              console.log('[ChatModal] Resolved conversation after send:', conv);
              setConversationId(conv);
              currentConversationId = conv;
            }
          } catch (e) {
            console.warn('[ChatModal] Failed to resolve conversation after send:', e);
          }
        }
      } catch (e) {
        console.warn('[ChatModal] Unexpected error during post-send conversation resolution:', e);
      }

      // ➤ REFRESH CONVERSATION LIST IN DASHBOARD (show new message card)
      try {
        const maxRefreshAttempts = 3;
        const delays = [300, 800, 1500];
        for (let attempt = 0; attempt < maxRefreshAttempts; attempt++) {
          await new Promise((res) => setTimeout(res, delays[attempt] || 500));
          try {
            await chatContext.refreshConversations();
            console.log('[ChatModal] Refreshed conversations after sending message (attempt', attempt + 1 + ')');
            break;
          } catch (err) {
            console.warn('[ChatModal] refreshConversations attempt failed', attempt + 1, err);
            if (attempt === maxRefreshAttempts - 1) {
              console.warn('[ChatModal] All refresh attempts failed');
            }
          }
        }
      } catch (e) {
        console.warn('[ChatModal] Failed to refresh conversations:', e);
      }

      // ➤ REPLACE OPTIMISTIC MESSAGE WITH REAL DATABASE MESSAGE
      if (data) {
        // Warn if the returned DB message doesn't include conversation_id
        if (!(data as any).conversation_id) {
          console.warn('[ChatModal] sendMessage response missing conversation_id', { data, conversationId });
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  id: data.id,
                  message: data.message,
                  sender_id: data.sender_id,
                  receiver_id: data.receiver_id,
                  timestamp: formatRelativeTime(
                    data.created_at,
                  ),
                  type: "text",
                  created_at: data.created_at,
                  is_read: data.is_read,
                }
              : msg,
          ),
        );

        // ➤ SEND AUTO-WELCOME MESSAGE (only on first message from user)
        if (isFirstMessage) {
          setIsFirstMessage(false);

          // Show typing indicator for the other user
          setShowTypingIndicator(true);

          // Send auto-welcome after a short delay (simulate typing)
          setTimeout(() => {
            setShowTypingIndicator(false);

            // Use a UI message type that allows `is_automated` without changing DB types
            const autoWelcomeMessage: Message & { is_automated?: boolean } = {
              id: `auto-welcome-${Date.now()}`,
              message: "Hi! Thank you for messaging! I'll get back to you as soon as possible!",
              sender_id: recipientIdStr || "system", // From the OTHER user
              receiver_id: senderId,
              timestamp: "Just now",
              type: "text",
              created_at: new Date().toISOString(),
              is_read: true,
              is_automated: true, // mark as automated for distinct styling
            };

            setMessages((prev) => [...prev, autoWelcomeMessage]);
          }, 1500); // 1.5 second delay to show typing
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error sending message");
    }

    setIsSending(false);

    // ➤ SCROLL TO BOTTOM
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMarkAsDone = () => {
    setIsMarkedAsDone(true);
    
    // Reset PROPOSED status if it exists
    if (transaction.status === "proposed") {
      setTransaction((prev) => ({
        ...prev,
        meetupDate: undefined,
        status: "pending",
        proposedAt: undefined,
        buyerConfirmed: false,
        sellerConfirmed: false,
      }));
    }
    
    setStatusBannerMessage(
      "🗂️ Conversation Marked as Done – Meet-up scheduling disabled.",
    );
    setStatusBannerType("info");
    setShowStatusBanner(true);
    toast.success("Conversation marked as done");
  };

  const handleCancelDone = () => {
    setIsMarkedAsDone(false);
    
    // Allow user to choose new meet-up date after canceling done status
    setStatusBannerMessage(
      "🔄 Conversation restored to active state.",
    );
    setStatusBannerType("success");
    setShowStatusBanner(true);
    toast.success("Conversation restored to active - you can now schedule a new meet-up");
  };

  const handleOpenDatePicker = () => {
    if (isMarkedAsDone) {
      toast.error("Meet-up scheduling is disabled", {
        description:
          'Please cancel "Mark as Done" status first',
      });
      return;
    }

    if (transaction.meetupDate) {
      toast.info("Meet-up already scheduled", {
        description: "Cannot change the date once set",
      });
      return;
    }

    setShowDatePicker(true);
  };

  const handleDateSelected = (date: Date) => {
    setTransaction({
      ...transaction,
      meetupDate: date,
      status: "proposed",
      proposedAt: new Date(),
    });
    setShowDatePicker(false);
    // Don't show any banner or toast
  };

  const handleOpenRatingModal = () => {
    if (transaction.status !== "completed") {
      toast.error("Rating unavailable", {
        description:
          "Transaction must be completed before rating",
        duration: 5000,
      });
      return;
    }

    if (
      !transaction.buyerConfirmed ||
      !transaction.sellerConfirmed
    ) {
      toast.error("Both parties must confirm first", {
        description: "Please wait for both confirmations",
        duration: 5000,
      });
      return;
    }

    setShowRatingModal(true);
  };

  const handleRatingSubmit = (
    rating: number,
    review: string,
  ) => {
    // In real implementation: submit rating to backend
    toast.success("Rating submitted successfully", {
      description: "You earned +2 credit points",
    });
    setShowRatingModal(false);
  };

  const handleProductClick = () => {
    if (product) {
      // Prepare complete seller information from product or otherUser
      const sellerInfo = product.seller || {
        id: recipientId,
        name: recipientName,
        username: recipientName
          .toLowerCase()
          .replace(/\s+/g, ""),
        creditScore: otherUser?.creditScore || 85,
        program: otherUser?.program || "Computer Science",
        yearLevel: otherUser?.yearLevel || "3rd Year",
        avatar: otherUser?.avatar,
        isTopBuyer: otherUser?.isTopBuyer || false,
        totalSales: otherUser?.totalSales || 0,
        joinedDate: otherUser?.joinedDate || "September 2023",
      };

      // Always send a complete product compatible with Marketplace ProductDetail
      setSelectedProductForDetail({
        id: product.id,
        title: product.title,
        price: product.price,

        // REQUIRED: always provide array of images
        images:
          product.images && product.images.length > 0
            ? product.images
            : product.image
              ? [product.image]
              : ["/placeholder.png"],

        // Required fallback fields
        description:
          product.description || "No description provided.",
        category: (product.category as any)?.name ?? product.category ?? "General",
        condition: product.condition || "Used",
        meetupLocation:
          product.meetupLocation ||
          "Main Gate, Cavite State University",
        postedDate: product.postedDate || "Just now",
        views: product.views ?? 0,
        rating:
          typeof product.rating === "number"
            ? product.rating
            : 4.5,
        reviewCount: product.reviewCount ?? 0,

        // Seller must contain all props Marketplace uses
        seller: {
          id: sellerInfo.id,
          name: sellerInfo.name,
          username: sellerInfo.username,
          avatar: sellerInfo.avatar || null,
          creditScore: sellerInfo.creditScore || 80,
          program: sellerInfo.program || "Unknown Program",
          yearLevel: sellerInfo.yearLevel || "N/A",
          isTopBuyer: sellerInfo.isTopBuyer || false,
          totalSales: sellerInfo.totalSales || 0,
          joinedDate: sellerInfo.joinedDate || "Unknown",
        },

        // Additional optional fields with safe fallbacks
        isNegotiable: product.isNegotiable ?? true,
        stock: product.stock ?? 1,
        tags: product.tags || [],
        deliveryOptions: product.deliveryOptions || [
          "Meet-up only",
        ],
      });
    }
  };

  const isPriorityBuyer =
    priorityBuyerProp ?? isTopFiveBuyer(recipientId);

  // ======== TRANSACTION COUNTDOWN HELPERS ========
  
  // Calculate days remaining until a target date
  const getDaysRemaining = (targetDate: Date): number => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Calculate if 3 days have passed since proposal
  const has3DaysPassed = (proposedAt: Date): boolean => {
    const now = new Date();
    const diff = now.getTime() - proposedAt.getTime();
    const daysPassed = diff / (1000 * 60 * 60 * 24);
    return daysPassed >= 3;
  };

  // Calculate if 7 days have passed
  const has7DaysPassed = (startDate: Date): boolean => {
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    const daysPassed = diff / (1000 * 60 * 60 * 24);
    return daysPassed >= 7;
  };

  // Check if today is the meetup day or later
  const isMeetupDayReached = (meetupDate: Date): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const meetup = new Date(meetupDate.getFullYear(), meetupDate.getMonth(), meetupDate.getDate());
    return today >= meetup;
  };

  // ======== TRANSACTION STATE MANAGEMENT ========

  // useEffect to handle automatic state transitions
  useEffect(() => {
    if (!transaction.meetupDate) return;

    const checkInterval = setInterval(() => {
      // STATUS: proposed → Check if 3 days passed without confirmation
      if (transaction.status === "proposed" && transaction.proposedAt) {
        if (has3DaysPassed(transaction.proposedAt)) {
          // Auto mark as done
          setTransaction((prev) => ({
            ...prev,
            status: "pending",
            meetupDate: undefined,
            proposedAt: undefined,
          }));
          setIsMarkedAsDone(true);
          toast.info("Meet-up proposal expired", {
            description: "No confirmation received within 3 days. Conversation marked as done.",
          });
        }
      }

      // STATUS: scheduled → Check if meetup day has arrived
      if (transaction.status === "scheduled" && transaction.meetupDate) {
        if (isMeetupDayReached(transaction.meetupDate) && !transaction.meetupDayReachedAt) {
          setTransaction((prev) => ({
            ...prev,
            status: "meetup_day_passed",
            meetupDayReachedAt: new Date(),
          }));
        }
      }

      // STATUS: meetup_day_passed → Check if 7 days passed without both completing
      if (transaction.status === "meetup_day_passed" && transaction.meetupDayReachedAt) {
        if (has7DaysPassed(transaction.meetupDayReachedAt)) {
          // Check if both users confirmed
          if (transaction.userCompletedConfirmation && transaction.otherUserCompletedConfirmation) {
            // Both completed → open rating modal
            setTransaction((prev) => ({
              ...prev,
              status: "completed",
            }));
            setShowRatingModal(true);
          } else {
            // Mark as unsuccessful
            setTransaction((prev) => ({
              ...prev,
              status: "unsuccessful",
              unsuccessfulAt: new Date(),
            }));
            toast.error("Transaction marked as unsuccessful", {
              description: "Both users did not confirm completion within 7 days.",
            });
          }
        }
      }

      // STATUS: unsuccessful → Check if 7 days passed without appeal
      if (transaction.status === "unsuccessful" && transaction.unsuccessfulAt) {
        if (has7DaysPassed(transaction.unsuccessfulAt)) {
          // Permanently unsuccessful
          toast.info("Transaction permanently unsuccessful", {
            description: "Appeal period has expired.",
          });
          // Could disable appeal button here
        }
      }

      // STATUS: appealed → Check if both appealed, then reopen 7-day window
      if (transaction.status === "appealed") {
        if (transaction.userAppealed && transaction.otherUserAppealed) {
          setTransaction((prev) => ({
            ...prev,
            status: "meetup_day_passed",
            meetupDayReachedAt: new Date(), // Restart 7-day window
            userCompletedConfirmation: false,
            otherUserCompletedConfirmation: false,
            userAppealed: false,
            otherUserAppealed: false,
          }));
          toast.success("Transaction reopened", {
            description: "Both users appealed. You have 7 days to confirm completion.",
          });
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [transaction]);

  // ======== TRANSACTION ACTION HANDLERS ========

  const handleConfirmMeetup = () => {
    // Mark current user as confirmed
    setTransaction((prev) => {
      const newBuyerConfirmed = true; // In production, check if current user is buyer
      const newSellerConfirmed = prev.sellerConfirmed || false; // Keep other user's status
      
      // Check if both confirmed - transition to SCHEDULED
      if (newBuyerConfirmed && newSellerConfirmed) {
        toast.success("Meet-up confirmed by both parties!", {
          description: "Countdown to meet-up day has started.",
        });
        return {
          ...prev,
          buyerConfirmed: newBuyerConfirmed,
          sellerConfirmed: newSellerConfirmed,
          status: "scheduled",
          confirmedAt: new Date(),
        };
      } else {
        // Only current user confirmed, waiting for other
        toast.success("You confirmed the meet-up", {
          description: "Waiting for the other user to confirm...",
        });
        return {
          ...prev,
          buyerConfirmed: newBuyerConfirmed,
        };
      }
    });

    // TODO: In production, send confirmation to backend
    // Simulate other user confirming after delay (REMOVE IN PRODUCTION)
    setTimeout(() => {
      setTransaction((prev) => {
        if (prev.buyerConfirmed && !prev.sellerConfirmed) {
          toast.success("Other user confirmed!", {
            description: "Meet-up is now scheduled.",
          });
          return {
            ...prev,
            sellerConfirmed: true,
            status: "scheduled",
            confirmedAt: new Date(),
          };
        }
        return prev;
      });
    }, 2000);
  };

  const handleMarkCompleted = () => {
    setTransaction((prev) => {
      const newUserConfirmed = true;
      const newOtherUserConfirmed = prev.otherUserCompletedConfirmation || false;
      
      // Check if both confirmed - transition to COMPLETED
      if (newUserConfirmed && newOtherUserConfirmed) {
        toast.success("Transaction completed!", {
          description: "Both parties confirmed completion.",
        });
        return {
          ...prev,
          userCompletedConfirmation: newUserConfirmed,
          otherUserCompletedConfirmation: newOtherUserConfirmed,
          status: "completed",
        };
      } else {
        // Only current user confirmed
        toast.success("You marked as completed", {
          description: "Waiting for other user to confirm...",
        });
        return {
          ...prev,
          userCompletedConfirmation: newUserConfirmed,
        };
      }
    });

    // TODO: In production, send to backend
    // Simulate other user confirming (REMOVE IN PRODUCTION)
    setTimeout(() => {
      setTransaction((prev) => {
        if (prev.userCompletedConfirmation && !prev.otherUserCompletedConfirmation) {
          toast.success("Other user confirmed!", {
            description: "Transaction is now complete. You can rate this user.",
          });
          return {
            ...prev,
            otherUserCompletedConfirmation: true,
            status: "completed",
          };
        }
        return prev;
      });
    }, 2000);
  };

  const handleAppeal = () => {
    setTransaction((prev) => {
      const newUserAppealed = true;
      const newOtherUserAppealed = prev.otherUserAppealed || false;
      
      // Check if both appealed - reopen transaction
      if (newUserAppealed && newOtherUserAppealed) {
        toast.success("Transaction reopened", {
          description: "Both users appealed. You have 7 days to confirm completion.",
        });
        return {
          ...prev,
          status: "meetup_day_passed",
          meetupDayReachedAt: new Date(), // Restart 7-day window
          userCompletedConfirmation: false,
          otherUserCompletedConfirmation: false,
          userAppealed: false,
          otherUserAppealed: false,
        };
      } else {
        // Only current user appealed
        toast.success("You submitted an appeal", {
          description: "Waiting for other user to appeal...",
        });
        return {
          ...prev,
          status: "appealed",
          userAppealed: newUserAppealed,
        };
      }
    });

    // TODO: In production, send to backend
    // Simulate other user appealing (REMOVE IN PRODUCTION)
    setTimeout(() => {
      setTransaction((prev) => {
        if (prev.userAppealed && !prev.otherUserAppealed) {
          toast.success("Other user also appealed!", {
            description: "Transaction reopened with new 7-day window.",
          });
          return {
            ...prev,
            otherUserAppealed: true,
            status: "meetup_day_passed",
            meetupDayReachedAt: new Date(),
            userCompletedConfirmation: false,
            otherUserCompletedConfirmation: false,
            userAppealed: false,
          };
        }
        return prev;
      });
    }, 2000);
  };

  // Calculate banner background based on type
  const getBannerStyles = () => {
    if (transaction.meetupDate && !isMarkedAsDone) {
      return "bg-green-50 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border-green-200 dark:border-[#14b8a6]/20 text-green-900 dark:text-green-100";
    }

    switch (statusBannerType) {
      case "success":
        return "bg-green-100 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border-green-300 dark:border-[#14b8a6]/20 text-green-900 dark:text-green-100";
      case "error":
        return "bg-red-50 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border-red-200 dark:border-[#14b8a6]/20 text-red-900 dark:text-red-100";
      case "info":
      default:
        return "bg-gray-100 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border-gray-300 dark:border-[#14b8a6]/20 text-gray-900 dark:text-gray-100";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="w-full max-w-[700px] h-[650px] flex flex-col p-0 rounded-2xl shadow-elev-3 gap-0 overflow-hidden bg-white"
          style={{
            zIndex,
            animation:
              "scaleIn 180ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          aria-describedby="chat-description"
        >
          {/* Header - Fixed with Green Background */}
          <div
            className="px-4 py-4 flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]"
            style={{
              ...(() => {
                const frameStyles = getCollegeFrameStyles(
                  otherUser?.frameEffect,
                  document.documentElement.classList.contains(
                    "dark",
                  ),
                );
                if (frameStyles) {
                  return {
                    background: frameStyles.bg,
                    borderColor: frameStyles.border,
                  };
                }
                return {};
              })(),
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/30">
                  <AvatarFallback className="bg-white/20 dark:bg-[var(--card)] text-white">
                    {recipientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base truncate text-white">
                    {recipientName}
                  </DialogTitle>
                  <div className="flex items-center gap-1.5 text-xs text-white/85 mt-0.5">
                    {onlineStatus.isOnline ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#1ecb4f] shadow-[0_0_4px_rgba(30,203,79,0.5)]" />
                        <span>{onlineStatus.statusText}</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#93a79c]" />
                        <span>{onlineStatus.statusText}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 dark:hover:bg-[var(--card)]"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hidden description for accessibility */}
          <DialogDescription className="sr-only" id="chat-description">
            Chat conversation with {recipientName}
          </DialogDescription>

          {/* Status Banners */}
          {(showStatusBanner || transaction.meetupDate) && (
            <div className="flex-shrink-0">
              {/* PROPOSED STATUS - Awaiting confirmation (3-day countdown) */}
              {transaction.status === "proposed" && transaction.meetupDate && transaction.proposedAt && (
                <div className={`px-4 py-3 border-b ${getBannerStyles()} transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm">
                        📅 Meet-up Proposed:{" "}
                        <strong>
                          {transaction.meetupDate.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>
                      </p>
                      <p className="text-xs mt-1 opacity-80">
                        {has3DaysPassed(transaction.proposedAt)
                          ? "⚠️ Confirmation period expired"
                          : `⏳ ${3 - Math.floor((new Date().getTime() - transaction.proposedAt.getTime()) / (1000 * 60 * 60 * 24))} days left for confirmation`}
                      </p>
                    </div>
                    {!has3DaysPassed(transaction.proposedAt) && (
                      <Button
                        onClick={handleConfirmMeetup}
                        size="sm"
                        className="ml-3 bg-green-600 hover:bg-green-700"
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* SCHEDULED STATUS - Countdown to meetup day */}
              {transaction.status === "scheduled" && transaction.meetupDate && (
                <div className={`px-4 py-3 border-b ${getBannerStyles()} transition-all duration-300`}>
                  <p className="text-sm">
                    📅 Confirmed Meet-up:{" "}
                    <strong>
                      {transaction.meetupDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    {isMeetupDayReached(transaction.meetupDate)
                      ? "✅ Meet-up day has arrived!"
                      : `⏳ ${getDaysRemaining(transaction.meetupDate)} days left before scheduled meet-up`}
                  </p>
                </div>
              )}

              {/* MEETUP_DAY_PASSED STATUS - 7-day window to confirm completion */}
              {transaction.status === "meetup_day_passed" && transaction.meetupDayReachedAt && (
                <div className={`px-4 py-3 border-b ${getBannerStyles()} transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm">
                        {has7DaysPassed(transaction.meetupDayReachedAt)
                          ? "⚠️ Completion window expired"
                          : `⏳ ${7 - Math.floor((new Date().getTime() - transaction.meetupDayReachedAt.getTime()) / (1000 * 60 * 60 * 24))} days left to confirm transaction result`}
                      </p>
                      <p className="text-xs mt-1 opacity-80">
                        {transaction.userCompletedConfirmation
                          ? "✓ You confirmed. Waiting for other user..."
                          : "Click Completed if transaction succeeded"}
                      </p>
                    </div>
                    {!transaction.userCompletedConfirmation && !has7DaysPassed(transaction.meetupDayReachedAt) && (
                      <Button
                        onClick={handleMarkCompleted}
                        size="sm"
                        className="ml-3 bg-green-600 hover:bg-green-700"
                      >
                        Completed
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* UNSUCCESSFUL STATUS - Appeal window */}
              {transaction.status === "unsuccessful" && transaction.unsuccessfulAt && (
                <div className={`px-4 py-3 border-b bg-red-50 dark:bg-gradient-to-br dark:from-[#5a0000] dark:to-[#2a0000] border-red-200 dark:border-red-900/20 text-red-900 dark:text-red-100 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm">
                        ❌ Transaction Unsuccessful
                      </p>
                      <p className="text-xs mt-1 opacity-80">
                        {has7DaysPassed(transaction.unsuccessfulAt)
                          ? "Appeal period has expired"
                          : transaction.userAppealed
                            ? "✓ You appealed. Waiting for other user..."
                            : `${7 - Math.floor((new Date().getTime() - transaction.unsuccessfulAt.getTime()) / (1000 * 60 * 60 * 24))} days left to appeal`}
                      </p>
                    </div>
                    {!transaction.userAppealed && !has7DaysPassed(transaction.unsuccessfulAt) && (
                      <Button
                        onClick={handleAppeal}
                        size="sm"
                        variant="destructive"
                        className="ml-3"
                      >
                        Appeal
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* COMPLETED STATUS */}
              {transaction.status === "completed" && (
                <div className={`px-4 py-3 border-b bg-green-100 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] border-green-300 dark:border-[#14b8a6]/20 text-green-900 dark:text-green-100 transition-all duration-300`}>
                  <p className="text-sm">
                    ✅ Transaction Completed Successfully!
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    You can now rate this user
                  </p>
                </div>
              )}

              {/* Temporary banner - Status messages (excluding meetup statuses) */}
              {showStatusBanner &&
                !statusBannerMessage.includes("scheduled") &&
                !statusBannerMessage.includes("Meet-up") && (
                  <div
                    className={`px-4 py-3 border-b ${getBannerStyles()} transition-all duration-300 animate-in fade-in slide-in-from-top-2`}
                  >
                    <p className="text-sm">
                      {statusBannerMessage}
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 pb-28 min-h-0 bg-[#F3F7F5] dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] relative" style={{ scrollPaddingBottom: '96px' }}>
            <div className="space-y-3 max-w-full">
              {Array.from(new Map(messages.map((m) => [m.id, m])).values()).map((message, index) => {
                // Determine if this message is from the current user
                const isMyMessage = message.sender_id === currentUserId;
                if (index === 0) {
                  console.log('ChatModal message comparison:', { 
                    'message.sender_id': message.sender_id, 
                    currentUserId, 
                    isMyMessage,
                    messageType: message.type
                  });
                }
                const isLastUserMessage =
                  isMyMessage && index === messages.length - 1;
                const messagesSent = messages.filter(
                  (m) => m.sender_id === currentUserId && m.type === "text"
                ).length;

                // Product card alignment logic:
                // - If current user is the seller of the product: Card is on RIGHT
                // - If current user is the buyer (product is not theirs): Card is on LEFT
                const prodSellerId = resolveProductSellerId(product, false);
                const isProductMine = product && (prodSellerId === currentUserId || (product.seller && product.seller.id === currentUserId));
                const productCardIsMyMessage = isProductMine; // Product card aligns with who owns the product

                return (
                  <div key={message.id ?? `msg-${index}-${message.created_at ?? index}`}>
                    {/* Decide alignment: center product card if seller unknown; otherwise standard left/right */}
                    <div
                      className={`flex ${
                        message.type === 'product' && !message.sender_id
                          ? 'justify-center'
                          : (message.type === 'product' ? productCardIsMyMessage : isMyMessage) ? 'justify-end' : 'justify-start'
                      }`}
                      style={{
                        animation: (message.type === 'product' ? productCardIsMyMessage : isMyMessage)
                          ? 'slideInRight 0.17s ease-out 0ms forwards'
                          : 'slideInLeft 0.18s ease-out 0ms forwards',
                        opacity: 0,
                      }}
                    >
                      {message.type === 'product' && product ? (
                        // Product Card Message - Centered if seller unknown, otherwise aligned
                        <div className={`bg-white dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] rounded-lg border border-gray-200 dark:border-[#14b8a6]/20 p-3 w-full sm:max-w-[320px] md:max-w-[280px] mb-3 relative z-10 transition-shadow ${
                          // If centered (no sender_id) don't apply corner-specific rounding
                          message.sender_id ? (productCardIsMyMessage ? 'rounded-br-[4px]' : 'rounded-bl-[4px]') : 'rounded-[12px]'
                        }`}>
                          {product && (
                            <ImageWithFallback
                              src={getPrimaryImage(product)}
                              alt={product.title}
                              className="w-full h-40 object-contain p-2 rounded-md mb-2 bg-transparent"
                            />
                          )}
                          <h4 className="text-sm mb-1 line-clamp-2">
                            {product.title}
                          </h4>
                          <p className="text-green-600 dark:text-green-400 mb-1">
                            ₱{product.price.toLocaleString()}
                          </p>
                          {product.meetupLocation && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                              <span className="text-green-600 dark:text-green-400">
                                📍
                              </span>
                              Preferred meetup: {" "}
                              {product.meetupLocation}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {message.timestamp}
                          </p>
                        </div>
                      ) : (
                        // Regular Text Message
                        <div
                          className={`px-4 py-2.5 max-w-[85%] sm:max-w-[75%] ${
                            ((message as any).is_automated)
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 italic rounded-md'
                              : isMyMessage
                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-[24px] rounded-br-[4px]'
                                : 'bg-[#F3F7F5] text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-[24px] rounded-bl-[4px] border border-transparent'
                          }`}
                        >
                          <p
                            className="text-sm whitespace-pre-wrap leading-relaxed break-words"
                            style={{
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                              hyphens: 'auto',
                            }}
                          >
                            {message.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isMyMessage
                                ? "text-white/70"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Read indicators for user's messages */}
                    {isLastUserMessage &&
                      message.type === "text" && (
                        <div className="flex justify-end mt-1">
                          <div className="text-[10.5px] opacity-75 flex items-center gap-0.5">
                            {messagesSent === 1 ? (
                              // Sent (single check)
                              <span className="text-[#a6b3ad]">
                                ✓
                              </span>
                            ) : messagesSent === 2 ? (
                              // Delivered (double check)
                              <span className="text-[#a6b3ad]">
                                ✓✓
                              </span>
                            ) : (
                              // Seen (double check with emerald glow)
                              <span
                                className="text-[#0c8f4a]"
                                style={{
                                  textShadow:
                                    "0 0 4px rgba(12,143,74,0.25)",
                                }}
                              >
                                ✓✓
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {showTypingIndicator && (
                <div
                  className="flex justify-start"
                  style={{
                    animation:
                      "slideInLeft 0.18s ease-out forwards",
                  }}
                >
                  <div className="px-4 py-2 h-[26px] rounded-[30px] bg-[var(--glass-bg)] dark:bg-[var(--card)] backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-1">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-[#0c8f4a]"
                      style={{
                        animation: "typingDot 1.4s ease-in-out 0s infinite",
                      }}
                    />
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-[#0c8f4a]"
                      style={{
                        animation: "typingDot 1.4s ease-in-out 0.2s infinite",
                      }}
                    />
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-[#0c8f4a]"
                      style={{
                        animation: "typingDot 1.4s ease-in-out 0.4s infinite",
                      }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Inline styles for animations */}
            <style>{`
              @keyframes slideInLeft {
                from {
                  opacity: 0;
                  transform: translateY(4px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              @keyframes slideInRight {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }

              @keyframes typingDot {
                0%, 60%, 100% {
                  transform: scale(0.8);
                  opacity: 0.5;
                }
                30% {
                  transform: scale(1.1);
                  opacity: 1;
                }
              }
            `}</style>
          </div>

          {/* Message Input - Fixed at Bottom with Messenger-style layout */}
          <div className="px-4 py-4 border-t border-border flex-shrink-0 bg-white dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]">
            <div className="flex gap-2 items-end">
              {/* Left buttons */}
              <div className="flex gap-1 flex-shrink-0">
                {/* Choose Meet-up Button */}
                {!transaction.meetupDate && !isMarkedAsDone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenDatePicker}
                    className="h-10 w-10 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                    title="Choose meet-up date"
                    aria-label="Choose meet-up date"
                  >
                    <Calendar className="h-5 w-5" />
                  </Button>
                )}

                {/* Mark as Done / Cancel Done Button */}
                {!isMarkedAsDone ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMarkAsDone}
                    disabled={transaction.status === "scheduled"}
                    className={`h-10 w-10 ${
                      transaction.status === "scheduled"
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                        : "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                    }`}
                    title={
                      transaction.status === "scheduled"
                        ? "Locked during scheduled meet-up"
                        : "Mark conversation as done"
                    }
                    aria-label="Mark conversation as done"
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelDone}
                    disabled={transaction.status === "scheduled"}
                    className={`h-10 w-10 ${
                      transaction.status === "scheduled"
                        ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                        : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    }`}
                    title={
                      transaction.status === "scheduled"
                        ? "Locked during scheduled meet-up"
                        : "Cancel done status"
                    }
                    aria-label="Cancel done status"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Text Input - grows to fill space */}
              <textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                className="flex-1 resize-none overflow-y-auto rounded-[20px] px-3 py-3 text-sm
                  bg-[#F3F7F5] dark:bg-[#1E1E1E] 
                  border border-[#C7DCC3]
                  focus:outline-none focus:border-[#1A7F37] focus:shadow-[0_0_6px_rgba(26,127,55,0.28)]
                  transition-all duration-200 ease-out
                  placeholder:text-gray-500 dark:placeholder:text-gray-400
                  min-h-[44px] max-h-[62px] sm:max-h-[72px]"
                style={{
                  lineHeight: "20px",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#C7DCC3 transparent",
                }}
              />

              {/* Send Button - right side */}
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                size="icon"
                className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
                type="button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelected={handleDateSelected}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RateThisUserModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          otherUser={{ name: recipientName }}
          onSubmitRating={handleRatingSubmit}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <ProductDetail
          onClose={() => setSelectedProductForDetail(null)}
          product={selectedProductForDetail}
          currentUser={currentUser}
          meetupLocations={[
            "Umall Gate",
            "Gate 1",
            "Gate 2",
          ]}
          onRequestEdit={(product) => {
            // Prefer bubbling edit to parent (App) so edit modal is top-level
            if (typeof onRequestEdit === 'function') {
              // Close the chat-specific product detail first and then instruct App to open the edit modal
              setSelectedProductForDetail(null);
              setTimeout(() => onRequestEdit(product), 0);
              return;
            }

            // Fallback: close product detail in chat and open local edit modal in chat context
            setSelectedProductForDetail(null);
            setTimeout(() => {
              // Use message-like experience: open the ProductDetail editor inline if needed
              // We don't have an app-level edit modal in this context, so leave to future enhancement.
            }, 0);
          }}
        />
      )}
    </>
  );
}