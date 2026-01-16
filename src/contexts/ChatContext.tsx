/**
 * Chat Context
 * Manages real-time chat state across the entire application
 * 
 * Provides:
 * - Unread message counts
 * - Conversation list with real-time updates
 * - Notification triggers
 * - Message subscriptions coordination
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { subscribeToConversationUpdates, getConversations, debugConversations } from '../services/messageService'
import { createNotification, notificationTemplates } from '../lib/services/notifications'
import { toast } from 'sonner'

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  product_id?: string;
}

interface ChatContextType {
  conversations: Conversation[];
  totalUnreadCount: number;
  isLoading: boolean;
  refreshConversations: () => Promise<void>;
  markConversationAsRead: (conversation_id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations on mount and when user changes
  useEffect(() => {
    console.log('[ChatProvider] useEffect triggered', { user, 'user?.id': user?.id });
    
    if (!user?.id) {
      console.log('[ChatProvider] No user ID found');
      setConversations([]);
      setTotalUnreadCount(0);
      return;
    }

    const userId = user.id;
    console.log('[ChatProvider] ✅ User ID found, loading conversations:', { userId });

    const loadConversations = async () => {
      setIsLoading(true);

      // Attach a safe debug helper immediately so console callers won't throw
      try {
        if (!(window as any).__debugGetConversations || typeof (window as any).__debugGetConversations !== 'function') {
          (window as any).__debugGetConversations = async () => {
            console.warn('[ChatProvider debug] __debugGetConversations called before initialization');
            return { ready: false, message: '__debugGetConversations not ready yet' };
          };
        }
      } catch (e) {
        // ignore
      }

      try {
        // Verify auth session is active before querying (RLS requires authenticated user)
        let authSession = null;
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          authSession = session;
          console.log('[ChatProvider] Auth session check:', { hasSession: !!session, userId: session?.user?.id });
          
          if (!session || !session.user?.id) {
            console.warn('[ChatProvider] Auth session is missing but user.id exists - this may cause RLS to block queries');
          }
        } catch (e) {
          console.warn('[ChatProvider] Failed to check auth session:', e);
        }

        console.log('[ChatProvider] Calling getConversations for user:', userId);
        const { data, error } = await getConversations(userId);
        
        console.log('[ChatProvider] getConversations response:', { 
          hasError: !!error, 
          dataIsArray: Array.isArray(data),
          dataLength: Array.isArray(data) ? data.length : typeof data,
          errorMessage: error?.message
        });

        // Expose debug helper to browser console for diagnostics
        try {
          // @ts-ignore - attach to window for temporary debugging
          window.__debugGetConversations = async () => {
            console.log('[ChatProvider debug] Debugging getConversations for', userId);
            const res = await debugConversations(userId);
            console.log('[ChatProvider debug] debugConversations result:', res);
            return res;
          };
        } catch (e) {
          console.warn('[ChatProvider] Could not attach debug helper to window', e);
        }
        
        if (error) {
          console.error('[ChatProvider] ❌ Error loading conversations:', error);
          setConversations([]);
          setTotalUnreadCount(0);
        } else if (Array.isArray(data)) {
          console.log('[ChatProvider] ✅ getConversations returned array:', { count: data.length });

          if (data.length === 0) {
            console.log('[ChatProvider] No conversations returned; attempting client-side fallback using messages');
            try {
              const debugRes = await debugConversations(userId);
              console.log('[ChatProvider] debugConversations response:', debugRes);
              const messages = debugRes.messages || [];

              if (messages && messages.length > 0) {
                // Group messages into conversations by conversation_id or participant pair
                const convMap = new Map();
                messages.forEach((m: any) => {
                  const key = m.conversation_id || `virtual:${[m.sender_id, m.receiver_id].sort().join(':')}`;
                  if (!convMap.has(key)) {
                    convMap.set(key, { messages: [] as any[], key });
                  }
                  convMap.get(key).messages.push(m);
                });

                const derived = Array.from(convMap.values()).map((entry: any) => {
                  const msgs = entry.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  const last = msgs[0];
                  const otherUserId = last.sender_id === userId ? last.receiver_id : last.sender_id;
                  return {
                    conversation_id: entry.key,
                    other_user_id: otherUserId,
                    last_message: last.message_text || last.content || last.message || '(No text)',
                    last_message_at: last.created_at,
                    unread_count: msgs.filter((mm: any) => mm.receiver_id === userId && !mm.is_read).length || 0,
                    other_user_name: 'Unknown User',
                    product_title: undefined,
                  };
                });

                console.log('[ChatProvider] Client-side derived conversations:', { count: derived.length, derived });

                // Enrich derived conversations with profile/product info when possible so dashboard shows real names
                try {
                  const { supabase } = await import('../lib/supabase');
                  const enriched = await Promise.all(derived.map(async (d: any) => {
                    if (d.other_user_id) {
                      try {
                        // Try by user_id on user_profile first
                        const { data: prof } = await supabase.from('user_profile').select('id, user_id, display_name, username, avatar_url').eq('user_id', d.other_user_id).maybeSingle();
                        if (prof) {
                          d.other_user_name = prof.display_name || prof.username || d.other_user_name;
                        } else {
                          // Try users table as fallback
                          const { data: u } = await supabase.from('users').select('name, username').eq('id', d.other_user_id).maybeSingle();
                          if (u) d.other_user_name = u.name || u.username || d.other_user_name;
                        }
                      } catch (e) {
                        // ignore enrichment errors
                      }
                    }

                    return d;
                  }));

                  setConversations(enriched);
                  const unreadCount = enriched.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
                  setTotalUnreadCount(unreadCount);
                  return;
                } catch (e) {
                  console.warn('[ChatProvider] Profile enrichment failed for derived conversations, using raw derived list', e);
                  setConversations(derived);
                  const unreadCount = derived.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
                  setTotalUnreadCount(unreadCount);
                  return;
                }
              }
            } catch (e) {
              console.warn('[ChatProvider] Fallback derivation failed:', e);
            }
          }

          console.log('[ChatProvider] ✅ Successfully set conversations:', { count: data.length });
          setConversations(data);
          const unreadCount = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          setTotalUnreadCount(unreadCount);
        } else {
          console.error('[ChatProvider] ❌ Data is not an array:', { data, type: typeof data });
          setConversations([]);
          setTotalUnreadCount(0);
        }
      } catch (err) {
        console.error('[ChatProvider] ❌ Exception during load:', err);
        setConversations([]);
        setTotalUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    console.log('[ChatProvider] Setting up real-time subscription for user:', userId);

    const unsubscribe = subscribeToConversationUpdates(userId, async (newMessage: any) => {
      console.log('[ChatProvider] Realtime message received:', { 
        conversation_id: newMessage?.conversation_id,
        sender_id: newMessage?.sender_id,
        receiver_id: newMessage?.receiver_id,
        created_at: newMessage?.created_at
      });

      // Defensive checks - ensure we have enough info
      if (!newMessage) {
        console.warn('[ChatProvider] Received empty realtime message, skipping');
        return;
      }

      if (!newMessage?.conversation_id && (!newMessage?.sender_id || !newMessage?.receiver_id)) {
        console.warn('[ChatProvider] Realtime message missing conversation and participant IDs, skipping', newMessage);
        return;
      }

      // Optimistically update the local conversation list immediately so receiver sees a card instantly
      try {
        const convId = newMessage?.conversation_id || `virtual:${[newMessage?.sender_id, newMessage?.receiver_id].filter(Boolean).sort().join(':')}`;
        const otherUserId = newMessage?.sender_id === userId ? newMessage?.receiver_id : newMessage?.sender_id;
        const lastText = newMessage?.message || newMessage?.message_text || newMessage?.content || '(No text)';
        const lastAt = newMessage?.created_at || new Date().toISOString();

        setConversations((prev) => {
          const existing = prev.find((c) => c.conversation_id === convId);
          if (existing) {
            return prev.map((p) =>
              p.conversation_id === convId
                ? { ...p, last_message: lastText, last_message_at: lastAt, unread_count: p.unread_count + (newMessage?.receiver_id === userId ? 1 : 0) }
                : p
            );
          }

          // Insert optimistic conversation entry immediately (use placeholder name)
        const newConv = {
            conversation_id: convId,
            other_user_id: otherUserId,
            last_message: lastText,
            last_message_at: lastAt,
            unread_count: newMessage?.receiver_id === userId ? 1 : 0,
            other_user_name: 'Unknown User',
          } as Conversation;

          // Kick off a background enrichment to resolve the other user's display name without blocking
          (async () => {
            try {
              const { supabase } = await import('../lib/supabase');
              let optimisticOtherName = 'Unknown User';
              const { data: profile } = await supabase.from('user_profile').select('id, user_id, display_name, username, avatar_url').eq('user_id', otherUserId).maybeSingle();
              if (profile) optimisticOtherName = profile.display_name || profile.username || optimisticOtherName;
              else {
                const { data: u } = await supabase.from('users').select('name, username').eq('id', otherUserId).maybeSingle();
                if (u) optimisticOtherName = u.name || u.username || optimisticOtherName;
              }

              setConversations((prev2) => prev2.map((p) => p.conversation_id === convId ? { ...p, other_user_name: optimisticOtherName } : p));
            } catch (e) {
              // ignore enrichment failure
            }
          })();

          return [newConv, ...prev];
        });

        // Trigger a full conversation refresh to reconcile metadata (names, titles, unread counts)
        console.log('[ChatProvider] Triggering full conversation refresh due to realtime message');
        const { data, error } = await getConversations(userId);
        
        if (error) {
          console.error('[ChatProvider] Error during realtime refresh:', error);
          return;
        }
        
        if (data) {
          console.log('[ChatProvider] Updated conversations from realtime:', { count: data.length });
          setConversations(data);
          const unreadCount = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          setTotalUnreadCount(unreadCount);
        }
      } catch (err) {
        console.error('[ChatProvider] Unexpected error during realtime refresh:', err);
      }

      // Show toast notification
      try {
        const senderName = newMessage?.sender_id || 'Someone';
        const messagePreview = newMessage?.message || newMessage?.message_text || newMessage?.content || '(No text)';
        
        toast.success(`New message from ${senderName}`, {
          description: messagePreview.substring(0, 50) + (messagePreview.length > 50 ? '...' : ''),
        });
      } catch (error) {
        console.error('[ChatProvider] Error creating notification:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Listen for transaction-created events dispatched by meetup flow and upsert conversation
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;

    const handler = async (e: any) => {
      try {
        const tx = e?.detail;
        if (!tx) return;

        console.log('[ChatProvider] Received transaction-created event:', tx);

        const convId = `transaction:${tx.id}`;
        const otherUserId = tx.sender_id === user.id ? tx.receiver_id : tx.sender_id;
        const lastText = tx.meetup_date ? `Meet-up scheduled: ${tx.meetup_date}` : 'Meet-up proposed';
        const lastAt = tx.created_at || new Date().toISOString();

        setConversations((prev) => {
          const existing = prev.find((c) => c.conversation_id === convId || (c.other_user_id === otherUserId && c.product_id === tx.product?.id));
          if (existing) {
            return prev.map((p) =>
              p.conversation_id === existing.conversation_id
                ? { ...p, last_message: lastText, last_message_at: lastAt }
                : p
            );
          }

          const newConv = {
            conversation_id: convId,
            other_user_id: otherUserId,
            last_message: lastText,
            last_message_at: lastAt,
            unread_count: 0,
            product_id: tx.product?.id,
            other_user_name: tx.buyer?.username || tx.seller?.username || 'Someone',
            product_title: tx.product?.title
          };

          return [newConv, ...prev];
        });

        // Attempt a full refresh to reconcile data with server and ensure counts are reflected
        try {
          const { data, error } = await getConversations(user.id);
          if (!error && Array.isArray(data)) {
            setConversations(data);
            const unreadCount = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
            setTotalUnreadCount(unreadCount);
          }
        } catch (err) {
          console.warn('[ChatProvider] Failed to refresh conversations after transaction event', err);
        }
      } catch (err) {
        console.error('[ChatProvider] Error handling transaction-created event', err);
      }
    };

    window.addEventListener('iskomarket:transaction-created', handler as any);
    return () => window.removeEventListener('iskomarket:transaction-created', handler as any);
  }, [user?.id]);

  const refreshConversations = async () => {
    const userId = user?.id || (user as any)?.user?.id;
    if (!userId) {
      console.warn('[ChatContext] refreshConversations called without user ID');
      return;
    }

    console.log('[ChatContext] Starting conversation refresh for user:', userId);
    setIsLoading(true);
    
    try {
      const { data, error } = await getConversations(userId);
      
      if (error) {
        console.error('[ChatContext] Error refreshing conversations:', error);
        toast.error('Failed to refresh conversations');
        setConversations([]);
      } else if (data) {
        console.log('[ChatContext] Successfully refreshed conversations:', { count: data.length, data });
        setConversations(data);
        const unreadCount = data.reduce((sum, conv) => sum + conv.unread_count, 0);
        setTotalUnreadCount(unreadCount);
      } else {
        console.warn('[ChatContext] No data returned from refreshConversations');
        setConversations([]);
      }
    } catch (err) {
      console.error('[ChatContext] Unexpected error in refreshConversations:', err);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markConversationAsRead = (conversation_id: string) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.conversation_id === conversation_id
          ? { ...conv, unread_count: 0 }
          : conv
      );

      const newTotal = updated.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setTotalUnreadCount(newTotal);

      return updated;
    });
  };

  const value: ChatContextType = {
    conversations,
    totalUnreadCount,
    isLoading,
    refreshConversations,
    markConversationAsRead,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

// Optional hook that doesn't throw - useful for components not guaranteed to have ChatProvider
export function useChatOptional() {
  const context = useContext(ChatContext);
  return context || {
    conversations: [],
    totalUnreadCount: 0,
    isLoading: false,
    refreshConversations: async () => {},
    markConversationAsRead: () => {},
  };
}
