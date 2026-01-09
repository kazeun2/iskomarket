import { supabase } from '../supabase';

export interface MessageCard {
  id: string;
  conversation_id: string;
  user_id: string;
  other_user_id: string;
  other_user?: { id: string; display_name?: string | null; avatar_url?: string | null } | null;
  product_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getMessageCards(userId: string, limit: number = 100) {
  // First, attempt the ideal nested select that returns other_user via FK relationship
  const { data, error } = await supabase
    .from('message_cards')
    .select(`
      id,
      conversation_id,
      user_id,
      other_user_id,
      product_id,
      last_message,
      last_message_at,
      unread_count,
      created_at,
      updated_at,
      other_user:other_user_id ( id, display_name, avatar_url )
    `)
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(limit);

  // If PostgREST complains about missing relationship (PGRST200) or missing columns (42703 / "does not exist"), fall back to a safe two-step query
  if (error) {
    const msg = (error?.message || '').toLowerCase();
    if (
      error?.code === 'PGRST200' ||
      error?.code === '42703' ||
      msg.includes('foreign key relationship') ||
      msg.includes('does not exist') ||
      msg.includes("could not find a relationship") ||
      msg.includes('could not find')
    ) {
      console.info('[messageCards] Schema/relationship mismatch when selecting nested user; falling back to two-step query', { message: error?.message });

      const { data: rows, error: rowsErr } = await supabase
        .from('message_cards')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(limit);

      if (rowsErr) {
        console.error('[messageCards] fallback rows query failed:', rowsErr);
        throw rowsErr;
      }

      // Fetch profiles for other_user_ids in bulk
      const otherUserIds = Array.from(new Set((rows || []).map((r: any) => r.other_user_id).filter(Boolean)));
      let profilesMap: Record<string, any> = {};
      if (otherUserIds.length > 0) {
        // Try to look up profiles by `id` first (newer schemas), then fallback to `user_id` for compatibility
        let profiles: any[] = [];
        const { data: byId } = await supabase
          .from('user_profile')
          .select('id, user_id, display_name, avatar_url, username')
          .in('id', otherUserIds as string[]);
        if (byId && byId.length) {
          profiles = byId;
        } else {
          const { data: byUserId } = await supabase
            .from('user_profile')
            .select('id, user_id, display_name, avatar_url, username')
            .in('user_id', otherUserIds as string[]);
          profiles = byUserId || [];
        }
        profilesMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id || p.user_id] = p; return acc; }, {});
      }

      // Attach profile objects to rows so UI can use the same shape
      const enriched = (rows || []).map((r: any) => ({ ...r, other_user: profilesMap[r.other_user_id] || null }));
      return enriched as MessageCard[];
    }

    console.error('[messageCards] getMessageCards error:', error);
    throw error;
  }

  return data as MessageCard[];
}

export function subscribeToMessageCards(userId: string, onEvent: (payload: any) => void) {
  const channel = supabase
    .channel(`message-cards:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'message_cards', filter: `user_id=eq.${userId}` },
      async (payload) => {
        // Enrich payload with other_user profile when possible so the UI can show a display name/avatar
        try {
          const card = payload.new || payload.old;
          if (card && card.other_user_id && !card.other_user) {
            // Try to fetch profile using `id` then fallback to `user_id` for compatibility
            let profile: any = null;
            try {
              const { data: p1 } = await supabase.from('user_profile').select('id, user_id, display_name, avatar_url, username').eq('id', card.other_user_id).maybeSingle();
              if (p1) profile = p1;
              else {
                const { data: p2 } = await supabase.from('user_profile').select('id, user_id, display_name, avatar_url, username').eq('user_id', card.other_user_id).maybeSingle();
                if (p2) profile = p2;
              }
            } catch (e) {
              // ignore
            }

            if (profile) {
              if (payload.new) payload.new.other_user = profile;
              if (payload.old) payload.old.other_user = profile;
            }
          }
        } catch (e) {
          console.warn('[messageCards] Failed to enrich payload with other_user', e);
        } finally {
          onEvent(payload);
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function markMessageCardRead(userId: string, conversationId: string) {
  const { data, error } = await supabase
    .from('message_cards')
    .update({ unread_count: 0, updated_at: new Date().toISOString() })
    .match({ user_id: userId, conversation_id: conversationId });

  if (error) {
    console.error('[messageCards] markMessageCardRead error:', error);
    throw error;
  }

  return data;
}
