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
// Transaction/meetup service temporarily disabled in chat context to avoid schema errors and /rest/v1/transactions calls
// import { getPendingTransactions, subscribeToTransaction, confirmTransaction, cancelMeetup, getTransaction, completeTransaction } from '../lib/services/transactions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
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
import { updateCreditScore } from "../lib/services/users"; // Persist credit score changes

import {
  formatOnlineStatus,
  formatRelativeTime,
} from "../utils/timeUtils";
import { confirmTransaction } from '../lib/services/transactions';
import {
  getUserOnlineStatus,
  sendMessage,
  sendUserMessage,
  getMessages,
  markAsRead,
  subscribeToMessages,
  updateUserActivity,
  getOrCreateConversation,
  findConversationBetween,
  getConversationHeader,
  getConversationSummary,
} from "../services/messageService";
// Meet-up actions disabled in chat UI until transactions schema is stable
import { agreeMeetupAndNotify } from "../lib/actions/meetup";
import { useAuth } from "../contexts/AuthContext";
import { useChatOptional } from "../contexts/ChatContext";
import { useConnection } from "../contexts/ConnectionStatusContext";

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
  is_pending?: boolean; // transient UI flag when message is queued/offline
  sender?: { id: string; display_name?: string | null; avatar_url?: string | null } | null;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  otherUser?: any;
  recipient?: string;
  contactId?: number;
  conversationId?: string; // optional pre-resolved conversation id (preferred when opening from message card)
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
  onSellerClick?: (seller: any) => void; // Optional handler to open SellerProfile at app level
}

interface Transaction {
  id?: string;
  meetupDate?: Date; // Store as Date object for easier calculations
  meetupLocation?: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  status:
    | "pending"
    | "confirmed"
    | "scheduled" // Confirmed, countdown to meetup
    | "proposed" // Date selected, awaiting confirmation
    | "meetup_day_passed" // 7-day window to confirm completion
    | "completed"
    | "cancelled"
    | "unsuccessful"
    | "appealed"
    | "disputed"; // Reopened after unsuccessful
  proposedAt?: Date; // When the date was proposed
  proposedBy?: string; // Who proposed the meetup (user id)
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
  conversationId: propConversationId,
  isPriorityBuyer: priorityBuyerProp,
  product,
  onRequestEdit,
  zIndex = 9999,
  onSellerClick,
}: ChatModalProps) {
  const { user, refreshUser } = useAuth(); // Get authenticated user and refresh helper
  const chatContext = useChatOptional(); // Get chat context for refreshing conversations
  // Connection context (optional - provider may not be mounted in some test harnesses)
  let connection: any = null;
  try { connection = useConnection(); } catch (e) { connection = null; }
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
  const [transaction, setTransaction] = useState<Transaction & { buyerId?: string; sellerId?: string; proposedAt?: Date }>({
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

  // Determine the recipient name (prefer display_name when available)
  const recipientName =
    otherUser?.display_name ||
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
  
  // Debug logging (dev-only): log only when a debug flag is enabled and when identity info changes
  useEffect(() => {
    if (!(window as any).__ISKOMARKET_DEBUG__) return;
    console.debug('ChatModal currentUserId:', {
      currentUserId,
      authUserId,
      userExists: !!user,
      'user.id': user?.id,
      currentUserExists: !!currentUser,
      'currentUser.id': currentUser?.id,
    });
  }, [currentUserId, authUserId, user?.id, currentUser?.id]);

  // Start with only product card (NO auto-welcome message yet)
  // When opened from notifications, product card should be right-aligned (MY product)
  // Product card message: only attach a sender_id if product seller is known; otherwise render centered product card
  const initialMessages: Message[] = product
    ? [
        {
          id: `product-card-${product.id}`,
          // Use explicit seller id when available; do NOT fall back to recipient (avoids mis-attribution)
          sender_id: resolveProductSellerId(product, false) ?? undefined,
          receiver_id: recipientIdStr ?? undefined,
          timestamp: "6:10 PM",
          type: "product",
          created_at: product.postedDate || new Date().toISOString(),
          is_read: false,
        },
      ]
    : [];

  const [messages, setMessages] =
    useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogContentRef = useRef<HTMLElement | null>(null);
  // Track whether the textarea had focus so we can restore it after renders that re-mount the element
  const wasTextareaFocusedRef = useRef(false);

  // Alias to reuse existing date picker hook for meetup proposal button in provided structure
  const setShowMeetupProposal = setShowDatePicker;

  // Local UI state used by the provided structure
  const [textareaHeight, setTextareaHeight] = useState<string | number>("auto");
  const canMarkAsDone = transaction.status !== "scheduled" && !isMarkedAsDone;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: 'end',
    });

    // If the textarea was focused before this messages update, restore focus and caret
    if (wasTextareaFocusedRef.current && textareaRef.current) {
      try {
        const el = textareaRef.current;
        const pos = el.value ? el.value.length : 0;
        el.focus();
        el.setSelectionRange(pos, pos);
      } catch (e) {
        // ignore
      }
    }
  }, [messages]);



  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationHeader, setConversationHeader] = useState<any | null>(null);

  // Helper to derive canonical user id (users.id) from incoming message object
  const getCanonicalSenderUserId = (msg: Message | null | undefined) => {
    if (!msg) return undefined;
    // `sender` may be a profile (with user_id) or a users row; prefer `user_id` which is the canonical users.id
    const sAny: any = msg.sender || {};
    return sAny.user_id || sAny.id || msg.sender_id || undefined;
  };

  // Load conversation header (other user + product) whenever conversationId becomes available
  useEffect(() => {
    let mounted = true;
    if (!conversationId || !currentUserId) {
      setConversationHeader(null);
      return;
    }

    (async () => {
      try {
        const res = await getConversationSummary(conversationId, currentUserId as string);
        if (!mounted) return;
        if (res && res.data) {
          setConversationHeader(res.data);
        } else {
          setConversationHeader(null);
        }
      } catch (e) {
        console.warn('[ChatModal] getConversationHeader failed:', e);
        if (mounted) setConversationHeader(null);
      }
    })();

    return () => { mounted = false; };
  }, [conversationId, currentUserId]);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const txUnsubRef = useRef<(() => void) | null>(null); // unsubscribe fn for transaction realtime subscription


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

      // Resolve conversation id: if caller provided a pre-resolved conversation id, prefer it
      let convId: string | null = null;
      try {
        if (propConversationId) {
          convId = propConversationId;
          setConversationId(propConversationId);
        } else if (product?.id) {
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

      // Attempt to eagerly load the conversation header (other user + product).
      // This helps us avoid duplicating product UI (product strip + product card) and lets
      // the messages load logic decide whether to insert a product 'type' message.
      let headerRes: any = null;
      try {
        const hdr = await getConversationSummary(convId, currentUserId as string);
        if (hdr && hdr.data) {
          headerRes = hdr.data;
          setConversationHeader(hdr.data);
        }
      } catch (e) {
        console.warn('[ChatModal] Eager getConversationHeader failed (will continue):', e);
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
        // Convert Supabase messages to UI format (include sender profile when available)
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          // Try all candidate content fields (message/body/message_text/content)
          message: msg.message ?? msg.body ?? msg.message_text ?? msg.content ?? '',
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          timestamp: formatRelativeTime(msg.created_at),
          type: 'text',
          created_at: msg.created_at,
          is_read: msg.is_read,
          // embed sender profile if available
          sender: msg.sender || null,
        }));

        // Insert product card at top if needed. Skip if the conversation header already contains a product
        if (product && !formattedMessages.some((m) => m.type === 'product') && !(headerRes && headerRes.product)) {
          formattedMessages.unshift({
            id: `product-card-${product.id}`,
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
        // Track whether the current user has previously sent a text message in this conversation
        setHasSentMessage(uniqueMessages.some((m) => m.type === 'text' && String(getCanonicalSenderUserId(m)) === String(currentUserId)));
        setIsFirstMessage(
          uniqueMessages.filter((m) => m.type === 'text').length === 0,
        );
        setIsFirstMessage(
          uniqueMessages.filter((m) => m.type === 'text').length === 0,
        );

        // Transaction/meetup lookup/subscription disabled temporarily to avoid schema mismatch and /rest/v1/transactions requests.
        // Previously this block called getPendingTransactions(...) and subscribeToTransaction(...).
        // Keeping local transaction UI state in-memory only (no server lookups) to preserve chat stability.
        try {
          if (product?.id && currentUserId) {
            // No-op: Do not query transactions in the chat context while migrations are pending.
            console.info('[ChatModal] Transactions are temporarily disabled in chat. Skipping transaction lookup/subscription for product', { productId: product.id });
          }
        } catch (e) {
          console.warn('[ChatModal] Transaction lookup skipped due to disabled state', e);
        }
      } else {
        // No messages yet, just show product card if available (ensure dedupe)
        let uniqueInitial = Array.from(new Map(initialMessages.map((m) => [m.id, m])).values());
        // If the conversation header already contains a product, don't show the inline product 'message'
        if (headerRes && headerRes.product) {
          uniqueInitial = uniqueInitial.filter((m) => m.type !== 'product');
        }
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
  }, [isOpen, userIdForMessages, recipientId, productIdForMessages, propConversationId]);

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
          message: newMsg.message || newMsg.message_text || newMsg.content || newMsg.body || '',
          sender_id: newMsg.sender_id,
          receiver_id: newMsg.receiver_id,
          timestamp: formatRelativeTime(newMsg.created_at),
          type: 'text',
          created_at: newMsg.created_at,
          is_read: newMsg.is_read,
          sender: newMsg.sender || null,
        };

        setMessages((prev) => {
          // If there's an optimistic queued message that matches message text and is pending, remove it when the real DB message arrives
          const filtered = prev.filter((m) => {
            const isPending = (m as any).is_pending || String(m.id).startsWith('queued-');
            if (!isPending) return true;
            if (m.message && String(m.message).trim() === String(formattedMessage.message).trim() && (conversationId == null || (m as any).conversation_id === conversationId)) {
              // Drop optimistic pending message - it will be replaced by the real message below
              return false;
            }
            return true;
          });

          const combined = filtered.some((m) => m.id === formattedMessage.id) ? filtered : [...filtered, formattedMessage];
          // Deduplicate by id to ensure no duplicate keys
          const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values());
          // If the message was sent by the current user (normalize using sender.profile.user_id if available), mark that they've sent at least one message
          if (String(getCanonicalSenderUserId(formattedMessage)) === String(currentUserId)) setHasSentMessage(true);
          return unique;
        });

        // Mark as read immediately using conversation_id for precision if we have one
        if (conversationId) {
          markAsRead({ user_id: currentUserId, conversation_id: conversationId });
        } else {
          // Best-effort fallback: mark messages from this sender as read
          markAsRead({ user_id: currentUserId, sender_id: newMsg.sender_id });
        }

        // Meetup/transaction-related message handling
        try {
          if (newMsg.automation_type && newMsg.automation_type.startsWith('meetup')) {
            const txId = newMsg.transaction_id || (newMsg as any).transactionId || (newMsg as any).tx_id;

            // Async handler: prefer fetching a real transaction when possible, otherwise fall back to parsing the message text
            (async () => {
              try {
                // If we have a server transaction id, try to fetch authoritative data
                if (txId) {
                  try {
                    const { getTransaction } = await import('../lib/services/transactions');
                    const tx = await getTransaction(String(txId));
                    if (tx) {
                      setTransaction((prev) => ({
                        ...prev,
                        id: tx.id,
                        meetupDate: tx.meetup_date ? new Date(tx.meetup_date) : prev.meetupDate,
                        meetupLocation: tx.meetup_location || prev.meetupLocation,
                        status: (tx.status as any) || 'proposed',
                        buyerId: tx.sender_id,
                        sellerId: tx.receiver_id,
                      }));

                      setStatusBannerMessage(`📅 Meet-up scheduled: ${tx.meetup_date ? new Date(tx.meetup_date).toLocaleString() : 'TBD'}`);
                      setStatusBannerType('info');
                      setShowStatusBanner(true);
                      clearTimeout(bannerTimeoutRef.current as any);
                      bannerTimeoutRef.current = setTimeout(() => setShowStatusBanner(false), 7000);
                      return;
                    }
                  } catch (e) {
                    // fetch failed — continue to parsing fallback
                  }
                }

                // Fallback: try to parse date/location from message text
                const text = String(newMsg.message || newMsg.message_text || newMsg.content || newMsg.body || '');
                // Look for common date patterns like "Jan 17 2026" or "January 17, 2026"
                let parsedDate: Date | undefined;
                const humanDateMatch = text.match(/(\w{3,9}\s+\d{1,2},?\s*\d{4})/);
                if (humanDateMatch) parsedDate = new Date(humanDateMatch[1]);
                if (!parsedDate) {
                  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
                  if (isoMatch) parsedDate = new Date(isoMatch[0]);
                }
                const locMatch = text.match(/at\s+(.+)$/i);
                const loc = locMatch ? locMatch[1].trim() : (newMsg.meetup_location || undefined);

                setTransaction((prev) => ({
                  ...prev,
                  meetupDate: parsedDate || prev.meetupDate,
                  meetupLocation: loc || prev.meetupLocation,
                  status: 'proposed',
                  proposedAt: new Date(newMsg.created_at),
                  proposedBy: newMsg.sender_id,
                  id: txId || prev.id,
                }));

                setStatusBannerMessage(`📅 Meet-up proposed${parsedDate ? `: ${parsedDate.toLocaleString()}` : ''}${loc ? ` at ${loc}` : ''}`);
                setStatusBannerType('info');
                setShowStatusBanner(true);
                clearTimeout(bannerTimeoutRef.current as any);
                bannerTimeoutRef.current = setTimeout(() => setShowStatusBanner(false), 7000);

              } catch (err) {
                console.warn('[ChatModal] Failed to process meetup message', err);
              }
            })();
          }
        } catch (e) {
          console.warn('[ChatModal] Error handling meetup/transaction message', e);
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

  // Subscribe to transaction updates when we have a transaction id
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Ensure previous subscription is cleared
      if (txUnsubRef.current) {
        try { txUnsubRef.current(); } catch (e) { console.warn('Failed to unsubscribe transaction channel', e); }
        txUnsubRef.current = null;
      }

      if (!transaction?.id) return;

      try {
        // Only subscribe if transactions table exists
        const { tableExists } = await import('../lib/db');
        if (!(await tableExists('transactions'))) {
          if (!mounted) return;
          console.warn('[ChatModal] transactions table not available; skipping transaction subscription');
          return;
        }

        const { subscribeToTransaction } = await import('../lib/services/transactions');
        txUnsubRef.current = subscribeToTransaction(String(transaction.id), (txUpdate: any) => {
          try {
            setTransaction((prev) => ({
              ...prev,
              meetupDate: txUpdate.meetup_date ? new Date(txUpdate.meetup_date) : prev.meetupDate,
              meetupLocation: txUpdate.meetup_location || prev.meetupLocation,
              status: txUpdate.status || prev.status,
              buyerConfirmed: (txUpdate as any).meetup_confirmed_by_buyer ?? prev.buyerConfirmed,
              sellerConfirmed: (txUpdate as any).meetup_confirmed_by_seller ?? prev.sellerConfirmed,
              id: txUpdate.id || prev.id,
            }));

            // Update banner so UI is clearly reflecting the live update
            setStatusBannerMessage(`📅 Meet-up updated: ${txUpdate.meetup_date ? new Date(txUpdate.meetup_date).toLocaleString() : ''}${txUpdate.meetup_location ? ` at ${txUpdate.meetup_location}` : ''}`);
            setStatusBannerType('info');
            setShowStatusBanner(true);
            clearTimeout(bannerTimeoutRef.current as any);
            bannerTimeoutRef.current = setTimeout(() => setShowStatusBanner(false), 7000);
          } catch (err) {
            console.warn('[ChatModal] Error applying transaction update', err);
          }
        });

      } catch (err) {
        console.warn('[ChatModal] Failed to subscribe to transaction updates', err);
      }
    })();

    return () => {
      mounted = false;
      if (txUnsubRef.current) {
        try { txUnsubRef.current(); } catch (e) { console.warn('Failed to unsubscribe transaction channel', e); }
        txUnsubRef.current = null;
      }
    };
  }, [transaction?.id, conversationId, product?.id]);

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
      const maxHeight = 120; // allow more vertical growth as requested

      // Calculate new height based on content, bounded by min/max
      const newHeight = Math.min(
        Math.max(scrollHeight, minHeight),
        maxHeight,
      );
      textareaRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(`${newHeight}px`);

      // If the textarea was focused before a re-render, restore focus and caret position
      if (wasTextareaFocusedRef.current) {
        try {
          const el = textareaRef.current;
          const pos = el.value ? el.value.length : 0;
          el.focus();
          el.setSelectionRange(pos, pos);
        } catch (e) {
          // ignore - best effort
        }
      }
    }
  }, [newMessage]);

  // Reconcile pending queued messages when ConnectionStatusProvider processes them
  useEffect(() => {
    const listener = (e: any) => {
      try {
        const detail = e?.detail;
        if (!detail) return;
        const { conversation_id, message } = detail;
        setMessages((prev) => prev.filter((m) => {
          const isPending = (m as any).is_pending || String(m.id).startsWith('queued-');
          if (!isPending) return true;
          // Remove pending optimistic message if text matches and conversation matches
          if (String(m.message).trim() === String(message).trim()) return false;
          return true;
        }));
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('iskomarket:queued-message-sent', listener as any);
    return () => window.removeEventListener('iskomarket:queued-message-sent', listener as any);
  }, [conversationId]);

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
    console.log('[ChatModal] handleSendMessage start', { messageText, conversationId });
    try { toast.info('Sending message...'); } catch (e) { /* ignore */ }

    // Enforce max length on the sending side too
    if (messageText.length > 1000) {
      toast.error('Message too long (maximum 1000 characters)');
      setIsSending(false);
      return;
    }

    // NOTE: do NOT clear the input until the send succeeds. Clearing before the network round-trip
    // causes the input to appear to 'lock' when the send fails; we only clear on success below.

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
      timestamp: "",
      type: "text",
      created_at: new Date().toISOString(),
      is_read: false,
      is_pending: false,
    };

    // If connection is offline, queue the message and mark optimistic as pending
    if (connection && !connection.isOnline) {
      optimisticMessage.is_pending = true;
      setMessages((prev) => [...prev, optimisticMessage]);
      setHasSentMessage(true);

      try {
        await connection.enqueueOutgoingMessage({ conversation_id: conversationId ?? null, senderId, receiverId: recipientIdStr, message: messageText, productId: product?.id ?? null });
      } catch (e) {
        console.error('[ChatModal] Failed to enqueue message', e);
        // remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error('Failed to queue message locally');
      } finally {
        setIsSending(false);
      }

      // Do not perform network send right now
      return;
    }

    setMessages((prev) => [...prev, optimisticMessage]);

    // Optimistically mark that the current user has sent a message (enables meet-up chooser)
    setHasSentMessage(true);

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

      // ➤ SEND TO SUPABASE (REAL ENTRY) using canonical `message` insert
      console.log('[ChatModal] Sending to sendUserMessage', { senderId, receiverId: recipientIdStr, productId: product?.id, conversation_id: currentConversationId });
      let insertedMsg: any = null;
      try {
        // Import supabase client and pass it explicitly
        const { supabase } = await import('../lib/supabase');
        insertedMsg = await sendUserMessage(supabase, currentConversationId || null, senderId, recipientIdStr, messageText);
        console.log('[ChatModal] sendUserMessage succeeded', { id: insertedMsg?.id });
      } catch (sendErr) {
        console.error('Error sending message:', sendErr);
        const code = sendErr?.code || sendErr?.status || 'unknown';
        const msg = (sendErr?.message && String(sendErr.message)) || JSON.stringify(sendErr);
        if (code === 'schema_incompatible') {
          toast.error('Could not send message: database schema is missing expected message column. Apply migration 20260116-add-message-column-and-messages-rls.sql or contact an admin.');
        } else {
          toast.error(`Could not send message (${code}): ${String(msg).slice(0,200)}. Open DevTools Console & Network and paste logs here.`);
        }

        // Remove optimistic bubble
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setIsSending(false);
        return;
      }

      // If server didn't return conversation_id on the inserted message, try to resolve it now (may have been created during send)
      try {
        if (insertedMsg && !(insertedMsg as any).conversation_id) {
          try {
            console.log('[ChatModal] sendUserMessage returned without conversation_id - resolving now');
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
      if (insertedMsg) {
        // Warn if the returned DB message doesn't include conversation_id
        if (!(insertedMsg as any).conversation_id) {
          console.warn('[ChatModal] sendUserMessage response missing conversation_id', { insertedMsg, conversationId });
        }

        setMessages((prev) => {
          const replaced = prev.map((msg) =>
            msg.id === tempId
              ? ({
                  id: insertedMsg.id,
                  message: insertedMsg.message,
                  sender_id: insertedMsg.sender_id,
                  receiver_id: insertedMsg.receiver_id,
                  timestamp: formatRelativeTime(insertedMsg.created_at),
                  type: "text",
                  created_at: insertedMsg.created_at,
                  is_read: insertedMsg.is_read,
                  sender: (insertedMsg as any).sender || null,
                } as Message)
              : msg,
          );


          // Deduplicate in case the realtime subscription already inserted the same DB message
          const unique = Array.from(new Map(replaced.map((m) => [m.id, m])).values());
          return unique;
        });

        // Clear the input only after the message was acknowledged by the server
        try { setNewMessage(""); } catch (e) { /* ignore */ }

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

  // Alias for button handler (placed after declaration to avoid 'used before declaration' errors)
  const handleSend = handleSendMessage;

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMarkAsDone = async () => {
    setIsMarkedAsDone(true);

    // Persist flag on conversation so backend automations can ignore this thread
    try {
      if (conversationId) {
        const { error } = await (await import('../lib/supabase')).supabase
          .from('conversations')
          .update({ is_done: true })
          .eq('id', conversationId);
        if (error) console.warn('[ChatModal] Failed to persist conversation is_done flag', error);
      }
    } catch (e) {
      console.warn('[ChatModal] Error setting conversation is_done', e);
    }

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

  const handleCancelDone = async () => {
    setIsMarkedAsDone(false);

    // Persist flag on conversation to re-enable automations
    try {
      if (conversationId) {
        const { error } = await (await import('../lib/supabase')).supabase
          .from('conversations')
          .update({ is_done: false })
          .eq('id', conversationId);
        if (error) console.warn('[ChatModal] Failed to clear conversation is_done flag', error);
      }
    } catch (e) {
      console.warn('[ChatModal] Error clearing conversation is_done', e);
    }

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

  // When opening the DatePicker, if the product specifies a meetupLocation (seller chose it at posting), pass it to the date picker so the user can't change it
  const renderDatePicker = () => (
    <DatePickerModal
      isOpen={showDatePicker}
      onClose={() => setShowDatePicker(false)}
      onDateSelected={handleDateSelected}
      fixedLocation={product?.meetupLocation}
    />
  );
  const handleDateSelected = async (date: Date, location?: string) => {
    // Optimistically update the UI
    setTransaction((prev) => ({
      ...prev,
      meetupDate: date,
      meetupLocation: location ?? prev.meetupLocation,
      status: "proposed",
      proposedAt: new Date(),
      proposedBy: currentUserId ?? undefined,
    }));
    setShowDatePicker(false);

    if (!product?.id) {
      toast.error('Unable to schedule meet-up: missing product information');
      return;
    }

    // Determine buyer/seller ids for the action. Prefer explicit product.seller_id when available.
    const sellerId = resolveProductSellerId(product, true);
    const buyerId = String(currentUserId ?? '')

    if (!sellerId || !buyerId) {
      toast.error('Unable to determine buyer or seller for the meet-up');
      return;
    }

    try {
      const chosenLocation = product?.meetupLocation ?? location ?? transaction.meetupLocation ?? 'TBD';

      try {
        // Attempt to create/update the meetup transaction on the server and notify the other user.
        // The helper will fall back to a local-only provisional transaction when the DB schema/permissions are not available.
        const tx = await agreeMeetupAndNotify({ productId: String(product.id), buyerId, sellerId: String(sellerId), meetupLocation: chosenLocation, meetupDate: date.toISOString() });

        // Map server/local response to UI state
        const isLocal = tx?.local_only === true || String(tx?.id || '').startsWith('local-');
        setTransaction((prev) => ({
          ...prev,
          meetupDate: tx?.meetup_date ? new Date(tx.meetup_date) : date,
          meetupLocation: tx?.meetup_location || chosenLocation,
          status: (tx?.status as any) || 'proposed',
          id: tx?.id || prev.id,
          proposedAt: tx?.proposed_at ? new Date(tx.proposed_at) : new Date(),
          proposedBy: tx?.proposed_by || currentUserId || undefined,
        }));

        if (isLocal) {
          setStatusBannerMessage(`📅 (Local) Meet-up proposed: ${date.toDateString()} at ${chosenLocation} — Meet-up creation is temporarily disabled.`);
          setStatusBannerType('info');
          toast.info('Meet-up scheduling is temporarily disabled. Your date is recorded locally only.');
        } else {
          setStatusBannerMessage(`📅 Meet-up proposed: ${date.toDateString()} at ${chosenLocation}`);
          setStatusBannerType('success');
          toast.success('Meet-up proposed and the other user has been notified.');
        }

        setShowStatusBanner(true);
        clearTimeout(bannerTimeoutRef.current as any);
        bannerTimeoutRef.current = setTimeout(() => setShowStatusBanner(false), 7000);

        // Dispatch/create transaction-created event in case helper couldn't (defensive)
        try { if (tx && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('iskomarket:transaction-created', { detail: tx })); } catch (e) { /* no-op */ }

      } catch (err: any) {
        console.warn('[ChatModal] agreeMeetupAndNotify failed, falling back to local only', err);

        setTransaction((prev) => ({
          ...prev,
          meetupDate: date,
          meetupLocation: chosenLocation,
          status: 'proposed',
          proposedAt: new Date(),
          proposedBy: currentUserId ?? undefined,
        }));

        const meetupLoc = transaction.meetupLocation || product?.meetupLocation || 'TBD'
        setStatusBannerMessage(`📅 (Local) Meet-up proposed: ${date.toDateString()} at ${meetupLoc} — Meet-up creation is temporarily disabled.`);
        setStatusBannerType('info');
        setShowStatusBanner(true);
        clearTimeout(bannerTimeoutRef.current as any);
        bannerTimeoutRef.current = setTimeout(() => setShowStatusBanner(false), 7000);
        toast.info('Meet-up scheduling is temporarily disabled. Your date is recorded locally only.');

        try {
          const localTx = { id: `local-${Date.now()}`, product_id: String(product.id), meetup_date: date.toISOString(), meetup_location: meetupLoc, status: 'proposed', buyerId, sellerId };
          window.dispatchEvent(new CustomEvent('iskomarket:transaction-created', { detail: localTx }));
        } catch (e) {
          // no-op
        }
      }

    } catch (e: any) {
      console.error('[ChatModal] Local meetup handling failed', e);
      setStatusBannerMessage(`Failed to schedule meet-up locally: ${(e && (e.message || e.error)) || 'Unknown error'}`);
      setStatusBannerType('error');
      setShowStatusBanner(true);
      clearTimeout(bannerTimeoutRef.current as any);
      bannerTimeoutRef.current = setTimeout(() => setShowStatusBanner(false), 9000);

      toast.error('Failed to propose meet-up (local)');
      // Revert optimistic state
      setTransaction((prev) => ({ ...prev, meetupDate: undefined, status: 'pending', proposedBy: undefined }));
    }
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

  const handleRatingSubmit = async (
    rating: number,
    review: string,
  ) => {
    if (!rating || rating <= 0) {
      toast.error('Invalid rating');
      return;
    }

    try {
      // Persist rating/review in backend if needed (omitted here) and award credit to rater
      if (currentUserId) {
        await updateCreditScore(String(currentUserId), 1, 'Left a review', 'increase');
        // Refresh auth profile so UI shows updated credit score immediately
        if (typeof refreshUser === 'function') await refreshUser();
      }

      toast.success('Review submitted successfully!', {
        description: '+1 credit point awarded for leaving a review',
      });
    } catch (err: any) {
      console.error('Error updating credit score:', err);
      toast.error('Failed to update credit score');
    } finally {
      setShowRatingModal(false);
    }
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
        postedDate: product.postedDate || "",
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

          // Notify the other user via an automated message
          (async () => {
            try {
              await sendMessage({
                sender_id: String(currentUserId),
                receiver_id: String(transaction.buyerId === String(currentUserId) ? transaction.sellerId : transaction.buyerId),
                product_id: String(product?.id),
                message: 'Meet-up proposal expired — conversation marked as done',
                automation_type: 'auto_mark_done',
              });
            } catch (e) {
              // Non-fatal
              console.warn('Failed to send auto mark-as-done message', e);
            }
          })();
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

  const handleConfirmMeetup = async () => {
    if (!transaction.id) {
      toast.error('No transaction to confirm');
      return;
    }

    const role = String(currentUserId) === String(transaction.buyerId) ? 'buyer' : 'seller';

    try {
      // Try to persist confirmation to the server. If transactions table is not available
      // or other errors occur, fall back to local optimistic update.
      const updated = await confirmTransaction(String(transaction.id), String(currentUserId), role as any);
      // Map fields back to transaction state
      setTransaction((prev) => ({
        ...prev,
        buyerConfirmed: updated.meetup_confirmed_by_buyer ?? prev.buyerConfirmed,
        sellerConfirmed: updated.meetup_confirmed_by_seller ?? prev.sellerConfirmed,
        status: updated.status || prev.status,
      }));

      toast.success('Meet-up confirmed');
    } catch (err: any) {
      console.warn('[ChatModal] confirmTransaction failed, falling back to local update', err);
      setTransaction((prev) => ({ ...prev, buyerConfirmed: role === 'buyer' ? true : prev.buyerConfirmed, sellerConfirmed: role === 'seller' ? true : prev.sellerConfirmed }));
      toast.info('Confirming meet-ups is temporarily disabled (local only).');
    }
  };

  const handleMarkCompleted = async () => {
    // Optimistically mark current user as completed and notify via chat message
    setTransaction((prev) => ({ ...prev, userCompletedConfirmation: true }));

    if (!transaction.id) {
      toast.error('No transaction to confirm');
      return;
    }

    try {
      await sendMessage({
        sender_id: String(currentUserId),
        receiver_id: String(transaction.buyerId === String(currentUserId) ? transaction.sellerId : transaction.buyerId),
        product_id: String(product?.id),
        message: 'Completed confirmation',
        transaction_id: String(transaction.id),
        automation_type: 'completed_confirmation',
      });

      toast.success('Marked as completed — waiting for other user');
    } catch (e: any) {
      console.error('Failed to send completed confirmation message', e);
      toast.error('Failed to mark as completed');
    }
  };

  const handleAppeal = async () => {
    setTransaction((prev) => ({ ...prev, userAppealed: true, status: 'appealed' }));

    if (!transaction.id) {
      toast.error('No transaction to appeal');
      return;
    }

    try {
      await sendMessage({
        sender_id: String(currentUserId),
        receiver_id: String(transaction.buyerId === String(currentUserId) ? transaction.sellerId : transaction.buyerId),
        product_id: String(product?.id),
        message: 'Appeal submitted',
        transaction_id: String(transaction.id),
        automation_type: 'appeal',
      });

      toast.success('Appeal submitted — waiting for other user');
    } catch (e: any) {
      console.error('Failed to send appeal message', e);
      toast.error('Failed to submit appeal');
    }
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

  // Chat header component (theme-aware, solid green)
  type ChatHeaderProps = {
    otherUser?: any;
    product?: any;
    onClose: () => void;
  };

  function ChatHeader({ otherUser, product, onClose }: ChatHeaderProps) {
    // Prefer conversationHeader data when available (support new and old shapes)
    const headerUserAny: any = conversationHeader?.otherUser || conversationHeader?.other_user || otherUser;
    const headerProduct = conversationHeader?.product || product;

    const displayName = headerUserAny?.display_name || headerUserAny?.name || headerUserAny?.username || recipientName || 'User';
    const initials = (displayName || 'UN').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();

    return (
      <header className="flex items-center gap-3 shrink-0 bg-emerald-600 text-emerald-50 dark:bg-emerald-700 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold">{initials}</div>
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold leading-tight truncate">{displayName}</span>
            {isTopFiveBuyer(headerUserAny) && <PriorityBadge size="sm" variant="compact" showIcon={true} />}
          </div>
          <span className="text-xs opacity-80 line-clamp-1">{headerProduct?.title ?? headerProduct?.name ?? ''}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-emerald-500/60 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </header>
    );
  }

  // Chat body : message list + optional meetup banner
  type ChatBodyProps = {
    messages: Message[];
    currentUserId?: string | null;
    meetup?: { date?: string | undefined; location?: string | undefined } | null;
    showTypingIndicator?: boolean;
    messagesEndRef?: React.RefObject<HTMLDivElement>;
  };

  function ChatBody({ messages, currentUserId, meetup, showTypingIndicator, messagesEndRef }: ChatBodyProps) {
    const formattedMeetup = meetup?.date ? new Date(meetup.date).toLocaleString() : null;

    return (
      <div className="flex flex-1 flex-col bg-transparent">
        {formattedMeetup && (
          <div className="mx-4 mt-3 mb-1 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm dark:bg-amber-900 dark:text-amber-50">
            <div className="font-semibold">Meet‑up proposed: {formattedMeetup}</div>
            {meetup?.location && <div className="opacity-80">{meetup.location}</div>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.map((msg, idx) => (
            <div key={msg?.id ?? `msg-${idx}`}>
              <MessageBubble message={msg} currentUserId={currentUserId} />
            </div>
          ))}

          {showTypingIndicator && (
            <div className="mt-2">
              <div className="inline-flex items-center rounded-full bg-muted/30 px-3 py-1 text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-1" style={{ animation: 'typingDot 1.4s ease-in-out 0s infinite' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 mr-1" style={{ animation: 'typingDot 1.4s ease-in-out 0.2s infinite' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" style={{ animation: 'typingDot 1.4s ease-in-out 0.4s infinite' }} />
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Chat footer (simple input bar) — extracted to top-level component to avoid remounting on every ChatModal render.
  // This prevents the textarea from losing focus on each keystroke.

  // NOTE: the actual implementation of ChatFooterComponent lives at module scope below.
  type ChatFooterProps = {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    sending: boolean;
    onShowDatePicker: () => void;
    onMarkAsDone: () => void;
    canMarkAsDone: boolean;
    isMarkedAsDone?: boolean;
    onCancelDone?: () => void;
    // Whether the current user has already sent a message in this conversation
    hasSentMessage?: boolean;
    // Provided by ChatModal so the footer can manage focus without being re-created
    textareaRef?: React.RefObject<HTMLTextAreaElement>;
    onTextareaFocus?: () => void;
    onTextareaBlur?: () => void;
  };

  // The implementation is moved to module scope to keep a stable identity across renders.

  // Simple, flat message bubble for chat (no extra shadows or nested card surface)
  type MessageBubbleProps = { message: Message; currentUserId?: string | null };
  function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
    // Defensive: sometimes the message array may contain null/undefined entries (external sources / race conditions)
    if (!message) return null;

    // Determine ownership using canonical users.id when possible (message.sender may contain user_profile.user_id)
    const senderUserId = (message.sender && ((message.sender as any).user_id || (message.sender as any).id)) || message.sender_id || undefined;
    const isOwn = String(senderUserId) === String(currentUserId);


    const content = message.message ?? (message as any).message_text ?? (message as any).content ?? '';
    const dateText = message.timestamp ?? formatRelativeTime(message.created_at ?? new Date().toISOString());

    const formattedTime = dateText;
    const hasContent = typeof content === 'string' && content.trim().length > 0;

    const isPending = !!message.is_pending || String(message.id).startsWith('queued-');

    return (
      <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="flex flex-col gap-1 max-w-[80%]">
          <div className={`${isOwn ? 'ml-auto' : 'mr-auto'} ${isOwn ? 'bg-emerald-600 text-emerald-50' : 'bg-white text-foreground border border-border dark:bg-slate-800 dark:text-slate-50'} rounded-2xl px-3 py-2 text-sm`}>
            {hasContent ? content : <span className="italic text-muted-foreground">(No message)</span>}
            {isPending && <span className="ml-2 text-[10px] opacity-80"> • Queued</span>}
          </div>
          <span className="mt-0.5 text-[10px] text-muted-foreground">{formattedTime}</span>
        </div>
      </div>
    );
  }

  // Slim meetup banner (appears at top of message list)
  function MeetupBanner({ date, proposedAt, location }: { date?: Date; proposedAt?: Date; location?: string }) {
    if (!date) return null;
    const formatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const daysLeft = proposedAt ? `${3 - Math.floor((new Date().getTime() - proposedAt.getTime()) / (1000 * 60 * 60 * 24))} days left for confirmation` : '';
    return (
      <div className="mx-4 mt-3 mb-1 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm">
        <div className="font-semibold">Meet‑up Proposed: {formatted}</div>
        <div className="opacity-80">{location} • {daysLeft}</div>
      </div>
    );
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (!isOpen) return;

    // Dev-only diagnostics: log computed styles for dialog and chat panel to catch white slabs
    const t = setTimeout(() => {
      try {
        const el = dialogContentRef.current as HTMLElement | null;
        const panel = el?.querySelector('[data-slot="chat-panel"]') as HTMLElement | null;
        const htmlDark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
        // Use info so it shows up in regular console output during dev
        console.info('[ChatModal:dev-diagnostics] isOpen:', isOpen, 'htmlDark:', htmlDark);

        if (el) {
          const s = getComputedStyle(el);
          console.info('[ChatModal:dev-diagnostics] DialogContent computed:', {
            background: s.background,
            backgroundColor: s.backgroundColor,
            backgroundImage: s.backgroundImage,
            boxShadow: s.boxShadow,
          });
        } else console.info('[ChatModal:dev-diagnostics] DialogContent ref not found');

        if (panel) {
          const sp = getComputedStyle(panel);
          console.info('[ChatModal:dev-diagnostics] chat-panel computed:', {
            background: sp.background,
            backgroundColor: sp.backgroundColor,
            boxShadow: sp.boxShadow,
          });
        } else console.info('[ChatModal:dev-diagnostics] chat-panel not found');
      } catch (e) {
        console.info('[ChatModal:dev-diagnostics] failed to read styles', e);
      }
    }, 50);

    return () => clearTimeout(t);
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          ref={dialogContentRef as any}
          className="flex flex-col w-full sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden bg-transparent text-foreground shadow-lg border border-border rounded-2xl"
          style={{ zIndex, animation: "scaleIn 180ms cubic-bezier(0.16, 1, 0.3, 1)", background: 'transparent', backgroundColor: 'transparent', backgroundImage: 'none', height: '75vh', maxHeight: '75vh' }}
          aria-describedby="chat-description"
        >
          <div data-slot="chat-panel" className="flex flex-col h-full rounded-3xl bg-emerald-50/10 dark:bg-muted/80 shadow-lg border border-border overflow-hidden"> 
            {/* Accessibility: provide a DialogTitle (sr-only) for screen readers */}
            <DialogTitle className="sr-only">Chat with {otherUser?.username ?? recipientName}</DialogTitle>
            <DialogDescription id="chat-description" className="sr-only">Chat with {recipientName}{product ? ` about ${product.title}` : ''}</DialogDescription>
          {/* Header - Fixed with Green Background */}
          {/* Chat Header */}
          <ChatHeader otherUser={otherUser} product={product} onClose={onClose} />

          {/* Product strip (compact, non-card UI) */}
          {conversationHeader?.product && (
            <div className="flex items-center gap-3 border-b bg-emerald-50/40 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{conversationHeader.product.title}</span>
                <span className="text-xs text-muted-foreground">₱{Number(conversationHeader.product.price || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
          {/* Meet-up / Status Banner */}
          {transaction.meetupDate ? (
            (() => {
              const dt = new Date(transaction.meetupDate as any);
              // Proposed — awaiting confirmation from other user
              if (transaction.status === 'proposed' || transaction.status === 'pending') {
                const proposer = transaction.proposedBy ?? transaction.buyerId ?? transaction.sellerId;
                const isProposer = String(proposer) === String(currentUserId);
                const isConfirmedForCurrent = String(currentUserId) === String(transaction.buyerId) ? transaction.buyerConfirmed : transaction.sellerConfirmed;

                return (
                  <div className="w-full px-3 py-2 text-sm rounded-b-md bg-blue-50 text-blue-800 dark:bg-slate-900 dark:text-blue-200 flex items-center justify-between">
                    <div>
                      <strong>📅 Scheduled Meet-up:</strong> {dt.toDateString()} {transaction.meetupLocation ? `– ${transaction.meetupLocation}` : ''}
                      <div className="text-xs text-muted-foreground">Awaiting confirmation from other user…</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isConfirmedForCurrent && !isProposer && (
                        <button onClick={() => {
                          // Confirmations are disabled while meetup/transaction schema is being stabilized
                          toast.info('Confirming meet-ups is temporarily disabled.');
                        }} className="text-xs bg-emerald-600 text-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-700">Confirm</button>
                      )}

                      <button onClick={async () => {
                        // Cancelling meetups is disabled while meetup/transaction schema is being stabilized
                        setTransaction((prev) => ({ ...prev, meetupDate: undefined, meetupLocation: undefined, status: 'pending', buyerConfirmed: false, sellerConfirmed: false }));
                        setStatusBannerMessage('Meet‑up cancelled (local only) – you can choose another date');
                        setStatusBannerType('info');
                        setShowStatusBanner(true);
                        clearTimeout(bannerTimeoutRef.current as any);
                        bannerTimeoutRef.current = setTimeout(() => setShowStatusBanner(false), 7000);
                        toast.info('Meet‑up cancelled (local only)');
                      }} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md hover:bg-red-100 dark:bg-red-900 dark:text-red-50">Cancel</button>
                    </div>
                  </div>
                );
              }

              if (transaction.status === 'scheduled') {
                const daysLeft = Math.max(0, getDaysRemaining(dt));
                return (
                  <div className="w-full px-3 py-2 text-sm rounded-b-md bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-50 flex items-center justify-between">
                    <div>
                      <strong>⏳</strong> {daysLeft} day{daysLeft !== 1 ? 's' : ''} left before the scheduled meet-up
                    </div>
                    <div className="text-xs text-muted-foreground">Countdown in progress</div>
                  </div>
                );
              }

              if (transaction.status === 'meetup_day_passed') {
                // Calculate days remaining for the 7-day post-meetup confirmation window
                const start = transaction.meetupDayReachedAt ? new Date(transaction.meetupDayReachedAt) : new Date();
                const daysLeft = Math.max(0, 7 - getDaysRemaining(start));
                return (
                  <div className="w-full px-3 py-2 text-sm rounded-b-md bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-50 flex items-center justify-between">
                    <div>
                      <strong>⏳</strong> {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to confirm transaction result
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleMarkCompleted} className="text-xs bg-emerald-600 text-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-700">Completed</button>
                      <button onClick={handleAppeal} className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded-md hover:bg-yellow-100">Appeal</button>
                    </div>
                  </div>
                );
              }

              if (transaction.status === 'unsuccessful') {
                return (
                  <div className="w-full px-3 py-2 text-sm rounded-b-md bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-50">
                    Transaction unsuccessful — appeal available
                  </div>
                );
              }

              return null;
            })()
          ) : (
            showStatusBanner && (
              <div className={`w-full px-3 py-2 text-sm rounded-b-md ${statusBannerType === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-50' : statusBannerType === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-50' : 'bg-blue-50 text-blue-800 dark:bg-slate-900 dark:text-blue-200'}`}>
                {statusBannerMessage}
              </div>
            )
          )}

          {product && !conversationHeader?.product && (
            <section className="shrink-0 border-b border-border bg-background px-3 py-2 flex items-center justify-between gap-2">
              <div onClick={handleProductClick} className="flex items-center gap-3 min-w-0 cursor-pointer">
                <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                  <ImageWithFallback src={getPrimaryImage(product)} alt={product.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{product.title}</div>
                  <div className="text-sm text-muted-foreground">₱{Number(product.price ?? 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Transaction brief / meetup actions */}
              {transaction?.meetupDate && (
                <div className="ml-2 flex-shrink-0 text-right">
                  <div className="text-xs text-muted-foreground">{new Date(transaction.meetupDate).toLocaleDateString()}</div>
                  <div className="mt-1 flex items-center gap-2">
                    {transaction?.buyerConfirmed && transaction?.sellerConfirmed ? (
                      <button type="button" onClick={handleOpenRatingModal} className="text-xs bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-50">Both Confirmed</button>
                    ) : (
                      <div className="text-xs text-muted-foreground">Awaiting confirmation</div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}




          {/* Messages Area - Scrollable */}
          <main className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-3 [&>*]:bg-transparent [&>*]:border-none [&>*]:shadow-none">
            {/* Show skeleton and spinner while messages are loading */}
            {isLoadingMessages ? (
              // Lazy import skeleton so we don't bloat initial bundle in rare cases
              <div className="p-2">
                <div className="flex items-center justify-center mb-2">
                  <div role="status" aria-live="polite" className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-muted" />
                </div>
                <div className="animate-pulse space-y-2"><div className="h-6 w-3/4 bg-muted rounded" /><div className="h-32 bg-muted rounded" /><div className="h-6 w-1/2 bg-muted rounded" /></div>
              </div>
            ) : (
              <ChatBody
                messages={messages.filter((m) => m.type !== 'product')}
                currentUserId={currentUserId}
                meetup={{ date: transaction.meetupDate ? transaction.meetupDate.toISOString() : undefined, location: transaction.meetupLocation }}
                showTypingIndicator={showTypingIndicator}
                messagesEndRef={messagesEndRef}
              />
            )}

            <div ref={messagesEndRef} />

            {/* Typing animation keyframes */}
            <style>{`
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
          </main>

          {/* Footer */}
          <ChatFooterComponent
            value={newMessage}
            onChange={(v: string) => setNewMessage(v)}
            onSend={handleSend}
            sending={isSending}
            onShowDatePicker={() => setShowMeetupProposal(true)}
            onMarkAsDone={handleMarkAsDone}
            canMarkAsDone={canMarkAsDone}
            isMarkedAsDone={isMarkedAsDone}
            onCancelDone={handleCancelDone}
            hasSentMessage={hasSentMessage}
            conversationId={conversationId}
            textareaRef={textareaRef}
            onTextareaFocus={() => { wasTextareaFocusedRef.current = true; }}
            onTextareaBlur={() => { wasTextareaFocusedRef.current = false; }}
          />

        </div>
        </DialogContent> 
      </Dialog>

      {/* Date Picker Modal */}
      {renderDatePicker()}

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
          // Forward seller click action to app-level handler so the SellerProfile modal opens the same way
          onSellerClick={onSellerClick}
        />
      )}
    </>
  );
}

// Top-level ChatFooterComponent — keeps a stable identity across re-renders to avoid remounting the textarea
const ChatFooterComponent = React.memo(function ChatFooterComponent({
  value,
  onChange,
  onSend,
  sending,
  onShowDatePicker,
  onMarkAsDone,
  canMarkAsDone,
  isMarkedAsDone,
  onCancelDone,
  hasSentMessage,
  conversationId,
  textareaRef,
  onTextareaFocus,
  onTextareaBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  onShowDatePicker: () => void;
  onMarkAsDone: () => void;
  canMarkAsDone: boolean;
  isMarkedAsDone?: boolean;
  onCancelDone?: () => void;
  hasSentMessage?: boolean;
  conversationId?: string | null;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  onTextareaFocus?: () => void;
  onTextareaBlur?: () => void;
}) {
  // compute meetUp locked state clearly here rather than inline to avoid confusing code
  const meetUpLocked = !!isMarkedAsDone || !(!!hasSentMessage || !!conversationId);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || sending) return;
    onSend();
  };

  return (
    <footer className="shrink-0 border-t border-border bg-background px-3 py-3 dark:bg-background">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Mark as Done toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isMarkedAsDone) {
                onCancelDone && onCancelDone();
              } else {
                onMarkAsDone();
              }
            }}
            title={isMarkedAsDone ? 'Cancel Mark as Done' : 'Mark as done'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted/30 disabled:opacity-50"
            disabled={!canMarkAsDone && !isMarkedAsDone}
          >
            {isMarkedAsDone ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </button>

          {/* Explicit Cancel Done text button for clarity */}
          {isMarkedAsDone && (
            <button type="button" onClick={() => onCancelDone && onCancelDone()} className="text-xs text-muted-foreground hover:underline">Cancel Done</button>
          )}
        </div>

        <button
          type="button"
          onClick={onShowDatePicker}
          title={isMarkedAsDone ? 'Meet-up scheduling is disabled while conversation is marked done' : 'Choose meet-up date'}
          disabled={meetUpLocked}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted/30 ${meetUpLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          📎
        </button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onFocus={onTextareaFocus}
            onBlur={onTextareaBlur}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              onChange(e.target.value);
            }}
            placeholder="Type your message..."
            rows={2}
            maxLength={1000}
            aria-describedby="chat-message-counter"
            className="flex-1 rounded-xl border border-border bg-input-background px-4 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900"
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!value.trim() || sending || value.length > 1000) return;
                onSend();
              }
            }}
          />
          <div id="chat-message-counter" className="absolute right-2 bottom-1 text-xs text-muted-foreground">{value.length}/1000</div>
        </div>

        <button type="submit" disabled={!value.trim() || sending || value.length > 1000} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-emerald-50 hover:bg-emerald-600 disabled:opacity-50">➤</button>
      </form>
    </footer>
  );
});

export { ChatFooterComponent };
