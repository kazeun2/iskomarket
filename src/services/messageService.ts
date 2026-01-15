/**
 * Message Service for IskoMarket
 * Handles real-time messaging with Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

/**
 * Helper to check if Supabase is ready
 */
function checkSupabaseReady(): boolean {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('[MessageService] Supabase is not configured. Message features disabled.');
    return false;
  }
  return true;
}

/**
 * Sends a new message
 * Uses server-side timestamp (NOW()) to avoid timezone issues
 * Returns the inserted row on success so callers can replace optimistic
 * messages with the authoritative server message (id, created_at, etc.).
 */
export async function sendMessage(data: {
  sender_id: string;
  receiver_id: string;
  product_id?: string;
  conversation_id?: string;
  // Accept either `message` or `content` to be forgiving of client callers
  message?: string;
  content?: string;
  // Optional metadata for automated messages or linking to transactions
  transaction_id?: string | null;
  automation_type?: string | null;
}): Promise<{ data: Message | null; error: any }> {
  try {
    if (!checkSupabaseReady()) {
      // MOCK MODE: Return a mock message for demo purposes
      console.log('[MessageService] Running in MOCK mode - message not saved to database');
      const text = (data.content || data.message || '').trim();
      const mockMessage: any = {
        id: `mock-${Date.now()}`,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        product_id: data.product_id || null,
        body: text,
        is_read: false,
        created_at: new Date().toISOString(),
        transaction_id: null,
        is_automated: false,
        automation_type: null,
      };
      return { data: mockMessage as Message, error: null };
    }

    const trimmedMessage = (data.content ?? data.message ?? '').trim();
    if (!trimmedMessage) return { data: null, error: { message: 'Message cannot be empty' } };

    const { data: authUserData } = await supabase.auth.getUser();
    const authUserId = authUserData?.user?.id;
    if (!authUserId) return { data: null, error: { message: 'Authentication required to send messages' } };

    const senderId = authUserId;
    const receiverId = data.receiver_id;

    // Resolve conversation (create if missing)
    let conversationId: string | null = data.conversation_id || null;
    if (!conversationId) {
      if (data.product_id) conversationId = await getOrCreateConversation(data.product_id, senderId, receiverId);
      else conversationId = await findConversationBetween(senderId, receiverId);
    }

    if (!conversationId) {
      // Create a bare conversation when none exists
      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({ buyer_id: senderId, seller_id: receiverId, product_id: data.product_id || null })
        .select('id')
        .single();
      if (createErr) return { data: null, error: createErr };
      conversationId = newConv?.id || null;

      // Ensure conversation participants exist for both users (idempotent upsert)
      try {
        await supabase
          .from('conversation_participants')
          .upsert([
            { conversation_id: conversationId, user_id: senderId, role: 'buyer' },
            { conversation_id: conversationId, user_id: receiverId, role: 'seller' },
          ], { onConflict: ['conversation_id', 'user_id'] });
      } catch (e) {
        // Non-fatal; we don't want to spam console on schema mismatch but surface friendly error upstream
      }
    }

    // Ensure conversation participants are present (best-effort, idempotent)
    try {
      await supabase
        .from('conversation_participants')
        .upsert([
          { conversation_id: conversationId, user_id: senderId, role: 'buyer' },
          { conversation_id: conversationId, user_id: receiverId, role: 'seller' },
        ], { onConflict: ['conversation_id', 'user_id'] });
    } catch (e) {
      // ignore - if table missing or columns differ, we'll still attempt to insert the message below
    }

    // Insert message using canonical `body` column
    const insertPayload: any = {
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      body: trimmedMessage,
      is_read: false,
    };

    if (data.transaction_id) insertPayload.transaction_id = data.transaction_id;
    if (data.automation_type) insertPayload.automation_type = data.automation_type;

    const { data: message, error } = await supabase.from('messages').insert(insertPayload).select().single();
    if (error) {
      // Return a friendly error for the UI and avoid noisy, unhelpful console traces
      console.error('[MessageService] Failed to insert message; payload:', { conversationId, senderId, receiverId });
      return { data: null, error };
    }

    // Normalize return shape for UI (include friendly `message` field for UI compatibility)
    const normalized = { ...(message as any), body: (message as any).body || (message as any).message || (message as any).message_text || (message as any).content || null, message: (message as any).body || (message as any).message || (message as any).message_text || (message as any).content || null, conversation_id: conversationId };

    // Best-effort: update conversation's last message fields
    (async () => {
      try {
        await supabase.from('conversations').update({ last_message_id: normalized.id, last_message_at: normalized.created_at }).eq('id', conversationId);
      } catch (e) {
        // ignore non-fatal errors
      }
    })();

    return { data: normalized as Message, error: null };
  } catch (err) {
    console.error('[MessageService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Gets messages for a conversation
 * CRITICAL: Must use conversation_id for RLS enforcement to prevent message leakage
 * Returns messages with real server timestamps
 */
export async function getMessages(params: {
  user_id: string;
  other_user_id: string;
  conversation_id?: string;
  product_id?: string;
  limit?: number;
}): Promise<{ data: Message[] | null; error: any }> {
  try {
    if (!checkSupabaseReady()) {
      // Return empty list in mock mode so UI still works without Supabase
      return { data: [], error: null };
    }

    // CRITICAL: conversation_id is REQUIRED to prevent message leakage across conversations
    // Without it, users with multiple conversations could see mixed messages
    if (!params.conversation_id) {
      console.error('[MessageService] getMessages called without conversation_id - this is a SECURITY RISK. Refusing to query.');
      return { data: null, error: { message: 'conversation_id is required for secure message retrieval' } };
    }

    // Only query by conversation_id - this ensures RLS policies are properly enforced
    const q = supabase
      .from('messages')
      .select(
        'id, conversation_id, sender_id, receiver_id, body, created_at, is_read, transaction_id, automation_type'
      )
      .eq('conversation_id', params.conversation_id)
      .order('created_at', { ascending: true });

    const query = params.limit ? q.limit(params.limit) : q;
    const { data, error } = await query;

    if (error) {
      console.error('[MessageService] Error fetching messages:', error);
      return { data: null, error };
    }

    const rows = (data || []) as any[];

    // Bulk fetch sender profiles from user_profile to attach username/avatar
    const senderIds = Array.from(new Set(rows.map((r: any) => r.sender_id).filter(Boolean)));
    let profilesMap: Record<string, any> = {};
    if (senderIds.length) {
      // Try lookup by id first, then fallback to user_id
      let profiles: any[] = [];
      const { data: byId } = await supabase
        .from('user_profile')
        .select('id, user_id, username, avatar_url')
        .in('id', senderIds as string[]);
      if (byId && byId.length) profiles = byId;
      else {
        const { data: byUserId } = await supabase
          .from('user_profile')
          .select('id, user_id, username, avatar_url')
          .in('user_id', senderIds as string[]);
        profiles = byUserId || [];
      }
      profilesMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id || p.user_id] = p; return acc; }, {});
    }

    const normalized = rows.map((m: any) => ({
      ...m,
      message: m.body || m.message || m.content || m.message_text,
      sender: profilesMap[m.sender_id] || null,
    }));

    return { data: normalized, error: null };
  } catch (err) {
    console.error('[MessageService] Unexpected error:', err);
    return { data: null, error: err };
  }
}


/**
 * Find or create a conversation for a given product between sender and receiver.
 * Returns conversation id or null on failure.
 */
export async function getOrCreateConversation(productId: string, senderId: string, receiverId: string): Promise<string | null> {

  try {
    // Try to find existing conversation with either assignment of buyer/seller
    const { data: existing, error: existingErr } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .or(
        `and(product_id.eq.${productId},buyer_id.eq.${senderId},seller_id.eq.${receiverId}),and(product_id.eq.${productId},buyer_id.eq.${receiverId},seller_id.eq.${senderId})`
      )
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      console.error('[MessageService] Error checking existing conversations:', existingErr);
    }
    if (existing && existing.id) return existing.id;

    // No conversation found - determine buyer/seller using product.seller_id
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .maybeSingle();

    if (prodErr) {
      console.error('[MessageService] Error fetching product to create conversation:', prodErr);
      return null;
    }
    if (!product || !product.seller_id) {
      // Fallback: try to infer seller from receiverId (best-effort) and continue
      console.warn('[MessageService] Product missing seller_id; attempting best-effort seller inference');
      const sellerId = product?.seller_id || receiverId;
      const buyerId = senderId === sellerId ? receiverId : senderId;

      // Attempt to create a conversation with inferred seller
      const { data: created, error: createErr } = await supabase
        .from('conversations')
        .insert({ product_id: productId, buyer_id: buyerId, seller_id: sellerId })
        .select('id')
        .single();

      if (createErr) {
        console.error('[MessageService] Failed to create conversation with inferred seller:', createErr);
        return null;
      }

      return created?.id || null;
    }

    const sellerId = product.seller_id;
    const buyerId = senderId === sellerId ? receiverId : senderId;

    // Create conversation
    const { data: created, error: createErr } = await supabase
      .from('conversations')
      .insert({ product_id: productId, buyer_id: buyerId, seller_id: sellerId })
      .select('id')
      .single();

    if (createErr) {
      console.error('[MessageService] Failed to create conversation:', createErr);
      return null;
    }

    const convId = created?.id || null;
    // Ensure participants exist for the conversation (idempotent)
    try {
      await supabase
        .from('conversation_participants')
        .upsert([
          { conversation_id: convId, user_id: buyerId, role: 'buyer' },
          { conversation_id: convId, user_id: sellerId, role: 'seller' },
        ], { onConflict: ['conversation_id', 'user_id'] });
    } catch (e) {
      // ignore - continue even if participants table missing; this will be fixed by running migrations
    }

    return convId;
  } catch (e) {
    console.error('[MessageService] Unexpected error in getOrCreateConversation:', e);
    return null;
  }
}

export async function findConversationBetween(userA: string, userB: string): Promise<string | null> {
  try {
    if (!checkSupabaseReady()) return null;
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(buyer_id.eq.${userA},seller_id.eq.${userB}),and(buyer_id.eq.${userB},seller_id.eq.${userA})`
      )
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn('[MessageService] findConversationBetween error:', error);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.error('[MessageService] Unexpected error in findConversationBetween:', err);
    return null;
  }
}

/**
 * Gets unread message count for a user
 */
export async function getUnreadCount(user_id: string): Promise<{ data: number; error: any }> {
  try {
    if (!checkSupabaseReady()) {
      return { data: 0, error: null };
    }

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user_id)
      .eq('is_read', false);

    if (error) {
      console.error('[MessageService] Error fetching unread count:', error);
      return { data: 0, error };
    }

    return { data: count || 0, error: null };
  } catch (err) {
    console.error('[MessageService] Unexpected error:', err);
    return { data: 0, error: err };
  }
}

/**
 * Marks messages as read
 */
export async function markAsRead(params: {
  user_id: string;
  sender_id?: string;
  product_id?: string;
  conversation_id?: string;
}): Promise<{ error: any }> {
  try {
    if (!checkSupabaseReady()) {
      return { error: null };
    }

    // Prefer updating by conversation_id when provided
    if (params.conversation_id) {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', params.conversation_id)
        .eq('receiver_id', params.user_id);
      if (error) {
        console.error('[MessageService] Error marking messages as read by conversation:', error);
        return { error };
      }
      return { error: null };
    }

    // Otherwise mark messages from a particular sender to the user, or all to the user
    let q = supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', params.user_id);
    if (params.sender_id) q = q.eq('sender_id', params.sender_id);

    const { error } = await q;
    if (error) {
      console.error('[MessageService] Error marking messages as read:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('[MessageService] Unexpected error:', err);
    return { error: err };
  }
}

/**
 * Subscribes to real-time message updates for a conversation
 * Listens for messages from other_user_id to current user, and also messages the current user sends
 * Also supports conversation_id-based filtering for better accuracy
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToMessages(
  params: {
    user_id: string;
    other_user_id: string;
    product_id?: string;
    conversation_id?: string;
  },
  onMessage: (message: Message) => void
): () => void {
  if (!checkSupabaseReady()) {
    // Return no-op cleanup function
    return () => {};
  }

  // Create a unique channel name for this subscription
  const channelName = params.conversation_id ? `messages:conversation:${params.conversation_id}` : `messages:${params.user_id}:${params.other_user_id}:${params.product_id || 'all'}`;

  // Build filter: if conversation_id is provided, subscribe by conversation; otherwise use sender/receiver
  // IMPORTANT: Include BOTH directions - messages from other user AND messages from current user
  // Note: Use conversation_id when available for better filtering (RLS + simpler)
  const filter = params.conversation_id
    ? `conversation_id=eq.${params.conversation_id}`
    : `or(and(sender_id.eq.${params.other_user_id},receiver_id.eq.${params.user_id}),and(sender_id.eq.${params.user_id},receiver_id.eq.${params.other_user_id}))`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: filter,
      },
      (payload) => {
        const raw = payload.new as any;
        // Normalize message content field - try multiple field names for compatibility
        const message = { 
          ...raw, 
          message: raw.message_text || raw.content || raw.message,
          message_text: raw.message_text || raw.content || raw.message 
        } as Message;

        console.log('[MessageService] subscribeToMessages - received payload:', {
          messageId: message.id,
          senderId: message.sender_id,
          receiverId: message.receiver_id,
          conversationId: (message as any).conversation_id,
          paramsUserId: params.user_id,
          paramsOtherUserId: params.other_user_id,
          paramsConversationId: params.conversation_id,
        });

        // If conversation_id provided, ensure it matches
        if (params.conversation_id && (message as any).conversation_id !== params.conversation_id) {
            console.log('[MessageService] Message conversation_id does not match filter, skipping');
          return;
        }

        // If caller relied on sender/receiver filter instead, verify the pair is correct
        // (Should be bidirectional: either other_user -> user OR user -> other_user)
        if (!params.conversation_id) {
          const isSenderToReceiver = message.sender_id === params.other_user_id && message.receiver_id === params.user_id;
          const isReceiverToSender = message.sender_id === params.user_id && message.receiver_id === params.other_user_id;
          if (!(isSenderToReceiver || isReceiverToSender)) {
            console.log('[MessageService] Message does not match sender/receiver filter, skipping');
            return;
          }
        }

        console.log('[MessageService] Message passed all filters, calling onMessage callback');

        // If sender profile is not embedded, attempt a best-effort fetch so UI can show display name/avatar in realtime
        if (!(message as any).sender || !(message as any).sender?.display_name) {
          (async () => {
            try {
              // Prefer `id` lookup then fallback to `user_id` for older schemas
              let profile: any = null;
              try {
                const { data: p1 } = await supabase.from('user_profile').select('id, user_id, display_name, avatar_url, username').eq('id', message.sender_id).maybeSingle();
                if (p1) profile = p1;
                else {
                  const { data: p2 } = await supabase.from('user_profile').select('id, user_id, display_name, avatar_url, username').eq('user_id', message.sender_id).maybeSingle();
                  if (p2) profile = p2;
                }
              } catch (e) {
                // ignore
              }

              if (profile) {
                (message as any).sender = profile;
              }
            } catch (e) {
              console.warn('[MessageService] Failed to fetch sender profile for realtime message', e);
            } finally {
              onMessage(message);
            }
          })();
        } else {
          onMessage(message);
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Gets all conversations for a user with proper metadata
 * Returns list of conversations with unread counts
 */
export async function getConversations(user_id: string): Promise<{
  data: Array<{
    conversation_id: string;
    other_user_id: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    product_id?: string;
    other_user_name?: string;
    other_user_username?: string;
    product_title?: string;
  }> | null;
  error: any;
}> {
  try {
    console.log('[MessageService] getConversations called for user:', { user_id, type: typeof user_id, length: user_id?.length });
    
    if (!checkSupabaseReady()) {
      console.log('[MessageService] Supabase not ready, returning empty data');
      return { data: [], error: null };
    }

    if (!user_id || user_id.length === 0) {
      console.log('[MessageService] Empty user_id provided');
      return { data: [], error: 'No user ID' };
    }

    // Query conversations directly - try multiple approaches
    console.log('[MessageService] Querying conversations for user:', user_id);
    
    // Initialize container for conversation rows
    let conversationRows: any[] = [];

    // First attempt: run a single joined query to get conversations where the user is a participant,
    // include participant profiles and the last message. This avoids depending on products/categories
    // and returns message-driven conversations directly from the DB.
    try {
      console.log('[MessageService] Attempting joined conversation query for user as participant');
      const { data: joinedRows, error: joinedErr } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          participants:conversation_participants (
            user_id,
            profiles ( id, full_name, avatar_url, username )
          ),
          last_message:messages ( id, content, sender_id, created_at, read_at, receiver_id )
        `)
        .eq('participants.user_id', user_id)
        .order('updated_at', { ascending: false });

      if (joinedErr) {
        console.warn('[MessageService] Joined conversations query error:', joinedErr.message);
      } else if (joinedRows && joinedRows.length > 0) {
        // Map joinedRows into the expected conversation shape
        conversationRows = joinedRows.map((r: any) => {
          return {
            id: r.id,
            buyer_id: null,
            seller_id: null,
            product_id: r.product_id || null,
            participants: r.participants || [],
            last_message: r.last_message || null,
            updated_at: r.updated_at,
          };
        });

        console.log('[MessageService] Joined query returned conversations:', conversationRows.length);
      } else {
        console.log('[MessageService] Joined query returned no rows; falling back to other strategies');
      }
    } catch (e) {
      console.warn('[MessageService] Exception running joined conversation query:', e);
    }

    // If joined query produced nothing, fall back to existing OR/separate queries approach
    if (!conversationRows || conversationRows.length === 0) {
      // First attempt: Try OR filter - this returns conversations where user is buyer OR seller
      let { data: orRows, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`);

      console.log('[MessageService] OR query result:', { error: convError?.message, count: orRows?.length || 0 });

      // If OR succeeded and returned data, use it
      if (!convError && orRows && orRows.length > 0) {
        conversationRows = orRows;
      } else if (convError) {
        // If OR failed, try separate queries (fallback)
        console.log('[MessageService] OR query failed, trying separate queries...');
        
        const { data: buyerConvs, error: buyerErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('buyer_id', user_id);
        
        const { data: sellerConvs, error: sellerErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('seller_id', user_id);

        console.log('[MessageService] Separate queries result:', { 
          buyerConvs: buyerConvs?.length || 0,
          buyerErr: buyerErr?.message,
          sellerConvs: sellerConvs?.length || 0,
          sellerErr: sellerErr?.message
        });

        // Combine results
        const allConvs = [...(buyerConvs || []), ...(sellerConvs || [])];
        
        // Remove duplicates
        const uniqueMap = new Map();
        allConvs.forEach(conv => {
          if (!uniqueMap.has(conv.id)) {
            uniqueMap.set(conv.id, conv);
          }
        });
        
        conversationRows = Array.from(uniqueMap.values());
        console.log('[MessageService] Combined conversations count:', conversationRows.length);
      }
    }

    if (!conversationRows || conversationRows.length === 0) {
      console.log('[MessageService] ⚠️ No conversations found in conversations table, trying to derive from messages table...');
      
      // Fallback: Get conversations from messages table
      // This works even if conversations query is blocked by RLS
      const { data: messages, error: messagesErr } = await supabase
        .from('messages')
        .select('conversation_id, sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (messagesErr) {
        console.warn('[MessageService] Error querying messages:', messagesErr?.message);
        return { data: [], error: null };
      }

      if (!messages || messages.length === 0) {
        console.log('[MessageService] ℹ️ No messages found for user either');
        // Continue to transaction fallback below (do not return early so we can still derive from transactions)
      }

      // Group messages by conversation_id
      const convMap = new Map();
      messages.forEach((msg: any) => {
        // Prefer explicit conversation_id when available
        if (msg.conversation_id) {
          if (!convMap.has(msg.conversation_id)) {
            convMap.set(msg.conversation_id, {
              id: msg.conversation_id,
              buyer_id: msg.sender_id,
              seller_id: msg.receiver_id,
              _derived: true,
            });
          }
          return;
        }

        // If message missing conversation_id, create a virtual conversation key based on participants
        const participants = [msg.sender_id, msg.receiver_id].sort();
        const virtualId = `virtual:${participants[0]}:${participants[1]}`;
        if (!convMap.has(virtualId)) {
          convMap.set(virtualId, {
            id: virtualId,
            buyer_id: msg.sender_id,
            seller_id: msg.receiver_id,
            product_id: null,
            _virtual: true,
          });
        }
      });

      conversationRows = Array.from(convMap.values());
      console.log('[MessageService] Derived conversations from messages:', { count: conversationRows.length });
      
      if (!conversationRows || conversationRows.length === 0) {
        console.log('[MessageService] ℹ️ Still no conversations found');
        // Continue - attempt transaction fallback and other merges below
      }
    }

    console.log('[MessageService] ✅ Found conversations:', { count: conversationRows.length, conversations: conversationRows });

    // Additional safety: ensure we include any conversations that can be derived directly from the messages table.
    // In some deployments the joined/OR queries above may not return every conversation (RLS, schema differences or join failures).
    // To avoid missing conversation cards, fetch recent messages for the user and merge any derived conversations
    // (either explicit conversation_ids or virtual pair-based keys) that are not already present.
    try {
      const { data: recentMessages, error: recentErr } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, conversation_id, message_text, content, created_at')
        .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!recentErr && recentMessages && recentMessages.length > 0) {
        const existingIds = new Set(conversationRows.map((c: any) => String(c.id)));
        const messageDerived: any[] = [];

        for (const msg of recentMessages) {
          const key = msg.conversation_id || `virtual:${[msg.sender_id, msg.receiver_id].sort().join(':')}`;
          if (!existingIds.has(String(key))) {
            existingIds.add(String(key));
            messageDerived.push({ id: key, buyer_id: msg.sender_id, seller_id: msg.receiver_id, _derived_from_message: true });
          }
        }

        if (messageDerived.length > 0) {
          conversationRows = conversationRows.concat(messageDerived);
          console.log('[MessageService] Merged message-derived conversations:', { added: messageDerived.length });
        }
      }
    } catch (e) {
      console.warn('[MessageService] Failed to merge message-derived conversations:', e);
    }

    // Additionally, include transaction-only conversation cards so meet-up proposals show even when no messages exist
    try {
      const { data: txs, error: txErr } = await supabase
        .from('transactions')
        .select('id, sender_id, receiver_id, buyer_id, seller_id, product_id, status, meetup_date, meetup_location, created_at')
        .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id},buyer_id.eq.${user_id},seller_id.eq.${user_id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!txErr && txs && txs.length > 0) {
        const existingIds = new Set(conversationRows.map((c: any) => String(c.id)));
        const txDerived: any[] = [];
        for (const tx of txs) {
          const key = `tx:${tx.id}`;
          if (!existingIds.has(String(key))) {
            existingIds.add(String(key));
            const buyer = tx.sender_id || tx.buyer_id || null;
            const seller = tx.receiver_id || tx.seller_id || null;
            txDerived.push({ id: key, buyer_id: buyer, seller_id: seller, product_id: tx.product_id, _derived_from_transaction: true, updated_at: tx.created_at });
          }
        }
        if (txDerived.length > 0) {
          conversationRows = conversationRows.concat(txDerived);
          console.log('[MessageService] Merged transaction-derived conversations:', { added: txDerived.length });
        }
      }
    } catch (e) {
      console.warn('[MessageService] Failed to merge transaction-derived conversations:', e);
    }

    // Fetch messages for each conversation to get last_message and unread_count
    const conversations = await Promise.all(
      conversationRows.map(async (conv: any) => {
        try {
          console.log('[MessageService] Processing conversation:', { 
            conv_id: conv.id, 
            buyer_id: conv.buyer_id, 
            seller_id: conv.seller_id,
            user_id
          });
          
          // Get the other user (not current user)
          let otherUserId: string | null = null;
          let otherUserName: string | undefined = undefined;
          let otherUserAvatar: string | undefined = undefined;

          if (conv.participants && Array.isArray(conv.participants) && conv.participants.length > 0) {
            const otherParticipant = conv.participants.find((p: any) => String(p.user_id) !== String(user_id));
            otherUserId = otherParticipant?.user_id ?? null;
            otherUserName = otherParticipant?.profiles?.full_name || otherParticipant?.profiles?.username;
            otherUserAvatar = otherParticipant?.profiles?.avatar_url;
          } else {
            // fallback to buyer/seller fields (legacy schema)
            otherUserId = conv.buyer_id === user_id ? conv.seller_id : conv.buyer_id;
          }

          console.log('[MessageService] Determined other user:', { otherUserId, otherUserName, current_user: user_id });

          // Prefer using pre-joined data when available (from the joined query)
          let messages: any[] | null = null;
          let msgErr: any = null;
          let lastMessage: any = null;
          let unreadCount = 0;

          if (conv.participants && Array.isArray(conv.participants) && conv.last_message) {
            // We received participant and message data from the joined query; normalize to array
            let maybeMessages: any[] = [];
            if (Array.isArray(conv.last_message)) {
              maybeMessages = conv.last_message as any[];
            } else if (conv.last_message) {
              // Sometimes the joined query may return a single object instead of an array
              maybeMessages = [conv.last_message as any];
            }

            messages = maybeMessages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            lastMessage = messages[0];
            unreadCount = messages.filter((m: any) => m.receiver_id === user_id && !m.read_at).length || 0;
            console.log('[MessageService] Using joined last_message data for conversation:', { conv_id: conv.id, message_count: messages.length, unreadCount });
          } else if ((conv as any)._virtual || String(conv.id).startsWith('virtual:')) {
            // Virtual conversation - fetch by participants
            console.log('[MessageService] Fetching messages for virtual conversation by participants', { conv_id: conv.id, buyer_id: conv.buyer_id, seller_id: conv.seller_id, product_id: conv.product_id });
            const participantFilter = `or(and(sender_id.eq.${conv.buyer_id},receiver_id.eq.${conv.seller_id}),and(sender_id.eq.${conv.seller_id},receiver_id.eq.${conv.buyer_id}))`;
            let q = supabase
              .from('messages')
              .select('id, message, message_text, content, created_at, is_read, read_at, receiver_id, conversation_id, sender_id')
              .or(participantFilter)
              .order('created_at', { ascending: false })
              .limit(10);

            const res = await q;
            messages = res.data as any[] | null;
            msgErr = res.error;
            lastMessage = messages?.[0];
            unreadCount = messages?.filter((m: any) => m.receiver_id === user_id && !m.read_at).length || 0;

            console.log('[MessageService] Messages for virtual conv:', { conv_id: conv.id, message_count: messages?.length || 0, unreadCount });
          } else {
            // Normal conversation with explicit conversation_id
            const res = await supabase
              .from('messages')
              .select('id, message, message_text, content, created_at, is_read, read_at, receiver_id, conversation_id, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(10);
            messages = res.data as any[] | null;
            msgErr = res.error;
            lastMessage = messages?.[0];
            unreadCount = messages?.filter((m: any) => m.receiver_id === user_id && !m.read_at).length || 0;

            console.log('[MessageService] Messages for conv by id:', { conv_id: conv.id, message_count: messages?.length || 0, unreadCount });
          }

          if (msgErr) {
            console.warn('[MessageService] Error fetching messages for conversation:', { conv_id: conv.id, error: msgErr?.message });
          }

          // Fetch user details - prefer participant profile data when available, otherwise fall back to users table
          let userData: any = null;

          if (otherUserName || otherUserAvatar) {
            userData = { name: otherUserName, username: undefined, avatar_url: otherUserAvatar };
          } else if (otherUserId) {
            try {
              const { data: user, error: userErr } = await supabase
                .from('users')
                .select('name, username, avatar_url')
                .eq('id', otherUserId)
                .maybeSingle();
              
              if (!userErr) {
                userData = user;
              } else {
                console.warn('[MessageService] Error fetching user data:', { otherUserId, error: userErr?.message });
              }
            } catch (e) {
              console.warn('[MessageService] Exception fetching user:', { otherUserId, error: e });
            }
          } else {
            userData = null;
          }

          // Fetch product title
          let productTitle = undefined;
          if (conv.product_id) {
            try {
              const { data: productData, error: prodErr } = await supabase
                .from('products')
                .select('title')
                .eq('id', conv.product_id)
                .maybeSingle();
              
              if (!prodErr && productData) {
                productTitle = productData.title;
              } else if (prodErr) {
                console.warn('[MessageService] Error fetching product:', { product_id: conv.product_id, error: prodErr?.message });
              }
            } catch (e) {
              console.warn('[MessageService] Exception fetching product:', { product_id: conv.product_id, error: e });
            }
          }

          // If after all attempts there is no last message, include a placeholder message so the
          // user still sees the conversation card (e.g., an empty conversation or system-started conv).
          if (!lastMessage) {
            console.log('[MessageService] No messages found for conversation, creating placeholder:', { conv_id: conv.id });
            lastMessage = {
              id: `placeholder-${conv.id}`,
              message_text: '(No messages yet)',
              created_at: conv.updated_at || new Date().toISOString(),
              is_read: true,
              receiver_id: null,
              sender_id: null,
            };
          }

          const result = {
            conversation_id: conv.id,
            other_user_id: otherUserId,
            last_message: lastMessage?.message || lastMessage?.message_text || lastMessage?.content || '(No text)',
            last_message_at: lastMessage?.created_at || conv.last_message_at || new Date().toISOString(),
            unread_count: unreadCount,
            product_id: conv.product_id,
            other_user_name: userData?.name || 'Unknown User',
            other_user_username: userData?.username,
            other_user_avatar: userData?.avatar_url,
            product_title: productTitle,
          };
          
          console.log('[MessageService] Built conversation result:', result);
          return result;
        } catch (e: any) {
          console.error('[MessageService] Error processing conversation:', { conv_id: conv?.id, error: e?.message });
          return null;
        }
      })
    );

    // Filter out null results and sort by last_message_at
    const validConversations = conversations
      .filter((c): c is any => c !== null)
      .sort((a, b) => {
        const dateA = new Date(b.last_message_at).getTime();
        const dateB = new Date(a.last_message_at).getTime();
        return dateA - dateB;
      });

    console.log('[MessageService] ✅ Final conversations prepared:', { 
      count: validConversations.length, 
      data: validConversations 
    });
    return { data: validConversations, error: null };
  } catch (err) {
    console.error('[MessageService] ❌ Unexpected error in getConversations:', err);
    return { data: [], error: err };
  }
}

/**
 * Debug helper - returns getConversations() plus raw messages for the user
 */
export async function debugConversations(user_id: string) {
  try {
    const conv = await getConversations(user_id);
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, conversation_id, message_text, content, created_at')
      .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    return { conv, messages, messagesError: error };
  } catch (e) {
    console.error('[MessageService] debugConversations error:', e);
    return { conv: null, messages: null, messagesError: e };
  }
}

/**
 * Subscribe to conversation list updates (new messages)
 * Notifies when a new message arrives for any conversation
 * Listens for BOTH incoming AND outgoing messages to show conversation cards for sender too
 */
export function subscribeToConversationUpdates(
  user_id: string,
  onUpdate: (message: Message) => void
): () => void {
  if (!checkSupabaseReady()) {
    return () => {};
  }

  // Subscribe to INCOMING messages (user as receiver)
  const incomingChannel = supabase
    .channel(`conversations:${user_id}:incoming`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user_id}`,
      },
      (payload) => {
        const raw = payload.new as any;
        console.debug('[MessageService] subscribeToConversationUpdates INCOMING payload:', raw);
        // Defensive: ensure payload has required fields
        if (!raw || (!raw.sender_id && !raw.receiver_id)) {
          console.warn('[MessageService] Incoming payload missing sender/receiver - skipping', raw);
          return;
        }

        const message = { 
          ...raw, 
          message: raw.message_text || raw.content || raw.message 
        } as Message;
        
        // Notify about new message
        onUpdate(message);
      }
    )
    .subscribe();

  // Subscribe to OUTGOING messages (user as sender) - so sender sees conversation card appear too
  const outgoingChannel = supabase
    .channel(`conversations:${user_id}:outgoing`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user_id}`,
      },
      (payload) => {
        const raw = payload.new as any;
        console.debug('[MessageService] subscribeToConversationUpdates OUTGOING payload:', raw);

        // Defensive: ensure payload has required fields
        if (!raw || (!raw.sender_id && !raw.receiver_id)) {
          console.warn('[MessageService] Outgoing payload missing sender/receiver - skipping', raw);
          return;
        }

        const message = { 
          ...raw, 
          message: raw.message_text || raw.content || raw.message 
        } as Message;
        
        // Notify about new message sent by this user
        onUpdate(message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(incomingChannel);
    supabase.removeChannel(outgoingChannel);
  };
}

/**
 * Gets recent conversations for a user
 * Returns list of users with their last message
 */
export async function getRecentConversations(user_id: string): Promise<{
  data: Array<{
    user_id: string;
    last_message: string;
    last_message_at: string;
    unread_count: number;
  }> | null;
  error: any;
}> {
  try {
    if (!checkSupabaseReady()) {
      return { data: null, error: { message: 'Supabase is not configured' } };
    }

    // This is a simplified version - in production, you'd want a more efficient query
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[MessageService] Error fetching conversations:', error);
      return { data: null, error };
    }

    // Group by conversation partner
    const conversationMap = new Map();

    messages?.forEach((msg) => {
      const partnerId = msg.sender_id === user_id ? msg.receiver_id : msg.sender_id;

      // Initialize conversation entry if missing
      let conv = conversationMap.get(partnerId);
      if (!conv) {
        conv = {
          user_id: partnerId,
          last_message: msg.message || msg.content || msg.message_text, // Prefer normalized `message`, fallback to other fields
          last_message_at: msg.created_at,
          unread_count: 0,
        };
        conversationMap.set(partnerId, conv);
      } else {
        // Update last message for existing conversation
        conv.last_message = msg.content || msg.message;
      }

      // Increment unread count for messages received by user and not read
      if (msg.receiver_id === user_id && !msg.is_read) {
        conv.unread_count += 1;
      }
    });

    const conversations = Array.from(conversationMap.values());
    return { data: conversations, error: null };
  } catch (err) {
    console.error('[MessageService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Updates user's last_active timestamp
 * Should be called periodically when user is active
 */
export async function updateUserActivity(user_id: string): Promise<{ error: any }> {
  try {
    if (!checkSupabaseReady()) {
      return { error: null };
    }

    const { error } = await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', user_id);

    if (error) {
      console.error('[MessageService] Error updating user activity:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('[MessageService] Unexpected error:', err);
    return { error: err };
  }
}

/**
 * Gets user's online status based on last_active
 */
export async function getUserOnlineStatus(user_id: string): Promise<{
  data: { last_active: string | null } | null;
  error: any;
}> {
  try {
    if (!checkSupabaseReady()) {
      return { data: null, error: { message: 'Supabase is not configured' } };
    }

    const { data, error } = await supabase
      .from('users')
      .select('last_active')
      .eq('id', user_id)
      .single();

    if (error) {
      console.error('[MessageService] Error fetching user status:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[MessageService] Unexpected error:', err);
    return { data: null, error: err };
  }
}