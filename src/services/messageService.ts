/**
 * Message Service for IskoMarket
 * Handles real-time messaging with Supabase
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

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

import { getTableColumns, tableExists } from '../lib/db';

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
        message: text,
        body: text, // keep both for compatibility
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

    // Ensure the current user is a participant (best-effort, idempotent). Only upsert current user to respect RLS.
    try {
      await supabase
        .from('conversation_participants')
        .upsert([
          { conversation_id: conversationId, user_id: senderId, role: 'buyer' },
        ], { onConflict: ['conversation_id', 'user_id'] });
    } catch (e) {
      // ignore - if table missing or columns differ, we'll still attempt to insert the message below
    }

    // Insert message using canonical `message` column (migration-aligned)
    const insertPayload: any = {
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      message: trimmedMessage,
      is_read: false,
    };

    if (data.transaction_id) insertPayload.transaction_id = data.transaction_id;
    if (data.automation_type) insertPayload.automation_type = data.automation_type;

    // Insert using canonical `message` column only (no legacy fallbacks)
    const { data: message, error } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select('id,conversation_id,sender_id,receiver_id,message,created_at,is_read,is_automated')
      .single();

    if (error) {
      // If missing canonical column in DB, return a helpful migration guidance error
      if (String(error?.message || '').match(/does not exist|could not find|PGRST204|column .*message.*does not exist/i) || String(error?.code || '').match(/^42703$/)) {
        return { data: null, error: { code: 'schema_incompatible', message: 'No recognized message content column found in messages table. Please apply migration to add a canonical `message` column.' } };
      }
      return { data: null, error };
    }

    // Normalize return shape for UI (use canonical `message` column)
    const normalized = { ...(message as any), message: (message as any).message || null, conversation_id: conversationId } as Message;

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
 * sendUserMessage: helper that inserts a user's message using the canonical `message` column only.
 * - Accepts a Supabase client so callers can pass the desired client (admin/client/session-specific)
 * - Throws on error so callers can handle errors uniformly
 */
export async function sendUserMessage(
  supabaseClient: SupabaseClient,
  conversationId: string | null,
  senderId: string,
  receiverId: string,
  text: string,
): Promise<Message> {
  if (!checkSupabaseReady()) throw new Error('Supabase not configured');
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('Empty message');

  const payload: any = {
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    message: trimmed,
    is_automated: false,
  };

  const { data, error } = await supabaseClient
    .from('messages')
    .insert(payload)
    .select('id,conversation_id,sender_id,receiver_id,message,created_at,is_automated')
    .single();

  if (error) {
    // Provide helpful error for missing canonical column
    if (String(error?.message || '').match(/does not exist|could not find|PGRST204|column .*message.*does not exist/i) || String(error?.code || '').match(/^42703$/)) {
      throw { code: 'schema_incompatible', message: 'No recognized message content column found in messages table. Please apply migration to add a canonical `message` column.' };
    }
    throw error;
  }

  return data as Message;
}

/**
 * sendMessageWithAutoReply: insert a user's message and optionally send an automated reply from the receiver once per day
 * Behavior:
 *  - Insert the user's message (via direct insert respecting RLS)
 *  - Read conversations.last_auto_reply_at and if no reply was sent today, insert automated message from recipient and update last_auto_reply_at
 *  - Returns: { userMessage, autoReplyMessage | null }
 */
export async function sendMessageWithAutoReply(opts: {
  sender_id: string;
  receiver_id: string;
  conversation_id?: string;
  product_id?: string;
  message?: string;
  automated_text?: string; // default automated text if needed
}): Promise<{ userMessage: Message | null; autoReply: Message | null; error: any }> {
  try {
    if (!checkSupabaseReady()) {
      // Mock mode: create synthetic messages for UI
      const now = new Date().toISOString();
      const userMessage: any = { id: `mock-${Date.now()}`, sender_id: opts.sender_id, receiver_id: opts.receiver_id, message: opts.message || '', body: opts.message || '', created_at: now, is_read: false };
      let auto: any = null;
      const today = new Date().toDateString();
      // For mock: allow one auto per day by tracking in-memory on window (only for dev)
      const key = `__iskomarket_auto_reply_${opts.conversation_id}`;
      const last = (window as any)[key] || null;
      if (!last || new Date(last).toDateString() !== today) {
        auto = { id: `mock-auto-${Date.now()}`, sender_id: opts.receiver_id, receiver_id: opts.sender_id, message: opts.automated_text || "Hi! Thank you for messaging! I'll get back to you as soon as possible!", body: opts.automated_text || "Hi! Thank you for messaging! I'll get back to you as soon as possible!", created_at: new Date().toISOString(), is_read: false, is_automated: true };
        (window as any)[key] = new Date().toISOString();
      }
      return { userMessage: userMessage as Message, autoReply: auto as Message, error: null };
    }

    // 1) Insert the user's message using canonical-only helper
    let normalizedUser: Message | null = null;
    try {
      const inserted = await sendUserMessage(supabase, opts.conversation_id || null, opts.sender_id, opts.receiver_id, (opts.message || '').trim());
      normalizedUser = inserted as Message;
      console.info('[MessageService] sendMessageWithAutoReply - user message inserted', { id: normalizedUser.id, conversation_id: normalizedUser.conversation_id });
    } catch (insertErr) {
      console.error('[MessageService] sendMessageWithAutoReply - failed to insert user message', insertErr);
      return { userMessage: null, autoReply: null, error: insertErr };
    }

    // 2) Read conversation.last_auto_reply_at and decide whether to send an automated reply
    try {
      const { data: conv } = await supabase.from('conversations').select('id, last_auto_reply_at').eq('id', opts.conversation_id).maybeSingle();
      const lastAuto = conv?.last_auto_reply_at ? new Date(conv.last_auto_reply_at) : null;
      const now = new Date();
      const sameDay = lastAuto && lastAuto.toDateString() === now.toDateString();

      if (!sameDay) {
        // Insert automated message from the receiver to the sender
        const autoText = opts.automated_text || "Hi! Thank you for messaging! I'll get back to you as soon as possible!";

        try {
          // Only attempt to insert an automated reply from the receiver's active session.
          const { data: session } = await supabase.auth.getUser();
          const currentAuthId = session?.user?.id;

          if (!currentAuthId || String(currentAuthId) !== String(opts.receiver_id)) {
            console.info('[MessageService] Skipping automated reply: current session user is not the intended auto-reply sender', { currentAuthId, intendedSender: opts.receiver_id });
            return { userMessage: normalizedUser, autoReply: null, error: null };
          }

          // Automated replies are temporarily disabled while schema/RLS/automation is stabilized. We intentionally do NOT insert automated replies here.
          console.info('[MessageService] Automated reply suppressed (disabled in code)');
          return { userMessage: normalizedUser, autoReply: null, error: null };
        } catch (e) {
          console.warn('[MessageService] Exception while evaluating auto-reply conditions', e, '— ignoring auto-reply and returning userMessage only');
          return { userMessage: normalizedUser, autoReply: null, error: null };
        }
      }

      // No auto reply needed today
      return { userMessage: normalizedUser, autoReply: null, error: null };
    } catch (e) {
      console.warn('[MessageService] sendMessageWithAutoReply - failed to determine last_auto_reply_at', e);
      // Don't block the user message if we can't check/insert automated reply
      return { userMessage: normalizedUser, autoReply: null, error: null };
    }
  } catch (err) {
    console.error('[MessageService] Unexpected error in sendMessageWithAutoReply:', err);
    return { userMessage: null, autoReply: null, error: err };
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
      .select('id, conversation_id, sender_id, receiver_id, message, created_at, is_automated, is_read, read_at')
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
        .select('id, user_id, display_name, username, avatar_url')
        .in('id', senderIds as string[]);
      if (byId && byId.length) profiles = byId;
      else {
        const { data: byUserId } = await supabase
          .from('user_profile')
          .select('id, user_id, display_name, username, avatar_url')
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
    // Ensure participant for the caller exists (idempotent). Only insert the current user to satisfy RLS policies.
    try {
      await supabase
        .from('conversation_participants')
        .upsert([
          { conversation_id: convId, user_id: senderId, role: senderId === buyerId ? 'buyer' : 'seller' },
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
            profiles ( id, display_name, avatar_url, username )
          ),
          last_message:messages ( id, message, message_text, content, body, sender_id, created_at, read_at, receiver_id, automation_type, transaction_id )
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
      // Prefer canonical `message` column only. If absent, skip message-derived conversation merging.
      const { data: recentMessages, error: recentErr } = await supabase
        .from('messages')
        .select('id,sender_id,receiver_id,conversation_id,message,created_at')
        .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (recentErr) {
        // If the `message` column is missing, Postgres will return an error - just warn and skip
        if (String(recentErr?.message || '').match(/does not exist|could not find|PGRST204|column .*message.*does not exist/i)) {
          console.warn('[MessageService] messages table missing canonical `message` column, skipping message-derived conversations');
        } else {
          console.warn('[MessageService] Failed to fetch recent messages:', recentErr);
        }
      } else if (recentMessages && recentMessages.length > 0) {
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

    // Transaction-derived conversations are disabled while transaction/meetup schema is being stabilized.
    // Previously this block queried the `transactions` table to surface meet-up-only conversation cards.
    // Skipping to avoid /rest/v1/transactions calls and schema-cache related errors.
    console.info('[MessageService] Skipped merging transaction-derived conversations (transactions are disabled)');

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
            // Prefer display_name from user_profile, then fallback to legacy full_name or username
            otherUserName = otherParticipant?.profiles?.display_name || otherParticipant?.profiles?.full_name || otherParticipant?.profiles?.username;
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
            const sel = 'id, message, created_at, is_read, read_at, receiver_id, conversation_id, sender_id, automation_type';

            let q = supabase
              .from('messages')
              .select(sel)
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
            const sel2 = 'id, message, created_at, is_read, read_at, receiver_id, conversation_id, sender_id, automation_type';

            const res = await supabase
              .from('messages')
              .select(sel2)
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
            } as any;
          }

          // Normalize last message text from any column that may contain it
          const lastText = (lastMessage?.message || lastMessage?.message_text || lastMessage?.content || lastMessage?.body || '').trim();

          // If userData is missing but lastMessage has a sender different from current user, prefer that sender as otherUserId
          if (!otherUserId && lastMessage?.sender_id && String(lastMessage.sender_id) !== String(user_id)) {
            otherUserId = lastMessage.sender_id;
            // Note: we will attempt to fetch user data below if needed
          }

          // Detect meetup metadata from last message if present
          let meetup_date: string | undefined = undefined;
          let meetup_location: string | undefined = undefined;
          try {
            if (lastMessage) {
              if (lastMessage.automation_type && String(lastMessage.automation_type).toLowerCase().startsWith('meetup')) {
                meetup_date = lastMessage.created_at;
                const locMatch = String(lastText || '').match(/(?:at|@)\s*([^\n]+)$/i);
                if (locMatch && locMatch[1]) meetup_location = locMatch[1].trim();
              } else {
                const m = String(lastText || '').match(/meet-?up[:\s]*([^\n]+)/i);
                if (m && m[1]) {
                  meetup_location = m[1].trim();
                  meetup_date = lastMessage.created_at;
                }
              }
            }
          } catch (e) {
            // ignore
          }

          const result = {
            conversation_id: conv.id,
            other_user_id: otherUserId,
            // Use normalized lastText for last_message; fallback to empty string
            last_message: lastText || '',
            last_message_at: lastMessage?.created_at || conv.last_message_at || new Date().toISOString(),
            unread_count: unreadCount,
            product_id: conv.product_id,
            // Detected meetup data
            meetup_date: meetup_date,
            meetup_location: meetup_location,
            // Do not inject hardcoded placeholders here; let consumers decide how to display missing names
            other_user_name: userData?.name ?? undefined,
            other_user_username: userData?.username ?? undefined,
            other_user_avatar: userData?.avatar_url ?? undefined,
            product_title: productTitle ?? undefined,
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
 * A minimal, robust ConversationHeader type returned to callers.
 */
export type ConversationHeader = {
  id: string;
  otherUser: { id: string; username?: string | null; display_name?: string | null; avatar_url?: string | null } | null;
  product: { id: string; title: string; price: number } | null;
};

/**
 * Get a conversation header (other user info + product info) for a given conversation id
 * This implementation performs a few simple queries that work reliably across schema variants
 */
export async function getConversationHeader(conversation_id: string, currentUserId: string): Promise<{ data: ConversationHeader | null; error: any }> {
  try {
    if (!checkSupabaseReady()) return { data: null, error: { message: 'Supabase not configured' } };
    if (!conversation_id) return { data: null, error: { message: 'conversation_id is required' } };

    // 1) Read the conversation row (grab buyer/seller and product id)
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, product_id')
      .eq('id', conversation_id)
      .maybeSingle();

    if (convError) return { data: null, error: convError };
    if (!conv) return { data: null, error: { message: 'Conversation not found' } };

    // SECURITY: Ensure the current user is a participant in the conversation. This prevents accidental
    // leakage if a conversation_id is passed from an untrusted source.
    try {
      const { data: participantCheck, error: pcErr } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation_id)
        .eq('user_id', currentUserId)
        .limit(1)
        .maybeSingle();

      if (pcErr) {
        // If the table doesn't exist or the query fails, fall back to conversation buyer/seller membership check
        console.warn('[MessageService] participant membership check failed, falling back to buyer/seller check', pcErr);
      } else if (!participantCheck) {
        // No explicit participant row found - ensure the current user is buyer/seller on the conversation
        if (String(conv.buyer_id) !== String(currentUserId) && String(conv.seller_id) !== String(currentUserId)) {
          return { data: null, error: { message: 'Access denied: current user is not part of this conversation' } };
        }
      }
    } catch (e) {
      // On unexpected errors, be defensive and enforce the buyer/seller fallback membership check
      if (String(conv.buyer_id) !== String(currentUserId) && String(conv.seller_id) !== String(currentUserId)) {
        return { data: null, error: { message: 'Access denied: current user is not part of this conversation' } };
      }
    }

    // 2) Try to get the other participant from conversation_participants, falling back to buyer/seller on the conversation row
    let otherUserId: string | null = null;
    try {
      const { data: participant, error: participantError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation_id)
        .neq('user_id', currentUserId)
        .limit(1)
        .maybeSingle();

      if (!participantError && participant && (participant as any).user_id) {
        otherUserId = (participant as any).user_id;
      }
    } catch (e) {
      // ignore and fall back to conversation buyer/seller
    }

    if (!otherUserId) {
      if (conv.buyer_id && String(conv.buyer_id) !== String(currentUserId)) otherUserId = conv.buyer_id;
      else if (conv.seller_id && String(conv.seller_id) !== String(currentUserId)) otherUserId = conv.seller_id;
    }

    // 3) Fetch the other user (if available)
    // Prefer canonical `users` row but fall back to `user_profile` when necessary (legacy rows may reference profile ids)
    let otherUser: any = null;
    if (otherUserId) {
      try {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', otherUserId)
          .maybeSingle();

        if (user) {
          otherUser = { id: user.id, username: user.username };
        } else {
          // If no users row found (otherUserId may be a user_profile.id), try user_profile as a fallback
          try {
            const { data: profileById, error: pbErr } = await supabase
              .from('user_profile')
              .select('id, user_id, username, display_name, avatar_url')
              .eq('id', otherUserId)
              .maybeSingle();

            let profile = profileById || null;
            if (!profile) {
              // Fall back to searching by user_id in case otherUserId is actually a users.id stored in profile.user_id
              const { data: profileByUserId, error: pbuErr } = await supabase
                .from('user_profile')
                .select('id, user_id, username, display_name, avatar_url')
                .eq('user_id', otherUserId)
                .maybeSingle();
              profile = profileByUserId || null;
            }

            if (profile) {
              otherUser = { id: profile.id || profile.user_id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url };
            } else if (userError) {
              console.warn('[MessageService] getConversationHeader user lookup failed', userError);
            }
          } catch (e) {
            console.warn('[MessageService] getConversationHeader profile lookup threw', e);
          }
        }
      } catch (e) {
        console.warn('[MessageService] getConversationHeader user lookup threw', e);
      }
    }

    // 4) Fetch the product (if referenced)
    let product: any = null;
    if (conv.product_id) {
      try {
        const { data: prod, error: productError } = await supabase
          .from('products')
          .select('id, title, price')
          .eq('id', conv.product_id)
          .maybeSingle();
        if (prod) product = { id: prod.id, title: prod.title, price: prod.price };
        else if (productError) console.warn('[MessageService] getConversationHeader product lookup failed', productError);
      } catch (e) {
        console.warn('[MessageService] getConversationHeader product lookup threw', e);
      }
    }

    const header: ConversationHeader = {
      id: conv.id,
      otherUser: otherUser || (otherUserId ? { id: otherUserId, username: '' } : null),
      product: product || null,
    };

    return { data: header, error: null };
  } catch (e) {
    console.error('[MessageService] getConversationHeader error:', e);
    return { data: null, error: e };
  }
}

export type ConversationSummary = {
  id: string;
  otherUser: { id: string; username?: string | null; display_name?: string | null } | null;
  product: { id: string; title: string; price: number } | null;
  meetup_date?: string | null;
  meetup_time?: string | null;
  lastMessage?: { text: string; created_at: string } | null;
};

/**
 * Get a conversation summary: header + last message + meetup metadata if available
 */
export async function getConversationSummary(conversationId: string, currentUserId: string): Promise<{ data: ConversationSummary | null; error: any }> {
  try {
    if (!checkSupabaseReady()) return { data: null, error: { message: 'Supabase not configured' } };
    if (!conversationId) return { data: null, error: { message: 'conversation_id is required' } };

    // Reuse header fetch
    const hdrRes = await getConversationHeader(conversationId, currentUserId);
    if (!hdrRes || !hdrRes.data) return { data: null, error: hdrRes.error || { message: 'Failed to fetch conversation header' } };

    // Last message (canonical `message` column)
    let lastMsg: any = null;
    try {
      const { data: lastRows, error: lastErr } = await supabase
        .from('messages')
        .select('message, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!lastErr && lastRows && lastRows.length) {
        const r = (lastRows as any[])[0];
        lastMsg = { text: r.message || '', created_at: r.created_at };
      }
    } catch (e) {
      console.warn('[MessageService] getConversationSummary last message lookup failed', e);
    }

    // Meetup/transaction info (best-effort) — only query if table exists to avoid noisy 400s
    let meetup: any = null;
    try {
      if (await tableExists('transactions')) {
        const { data: tx, error: txErr } = await supabase
          .from('transactions')
          .select('meetup_date, meetup_time')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!txErr && tx) {
          meetup = { meetup_date: (tx as any).meetup_date, meetup_time: (tx as any).meetup_time };
        }
      }
    } catch (e) {
      // ignore missing transactions table or query errors
    }

    const summary: ConversationSummary = {
      id: hdrRes.data.id,
      otherUser: hdrRes.data.otherUser || null,
      product: hdrRes.data.product || null,
      meetup_date: meetup?.meetup_date || null,
      meetup_time: meetup?.meetup_time || null,
      lastMessage: lastMsg || null,
    };

    return { data: summary, error: null };
  } catch (e) {
    console.error('[MessageService] getConversationSummary error:', e);
    return { data: null, error: e };
  }
}

/**
 * Debug helper - returns getConversations() plus raw messages for the user
 */
export async function debugConversations(user_id: string) {
  try {
    const conv = await getConversations(user_id);

    // Debug convenience: only select canonical `message` (if missing we'll get an error and surface it)
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id,sender_id,receiver_id,conversation_id,message,created_at')
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