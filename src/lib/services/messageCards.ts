import { supabase } from '../supabase';

export interface MessageCard {
  id: string;
  conversation_id: string;
  user_id: string;
  other_user_id: string;
  other_user?: { id: string; username?: string | null; display_name?: string | null; avatar_url?: string | null } | null;
  product_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getMessageCards(userId: string, limit: number = 100) {
  // Use a single, reliable two-step query:
  // 1) fetch the message_cards rows for the user
  // 2) fetch profiles for other_user_ids and attach username/avatar
  const { data: rows, error: rowsErr } = await supabase
    .from('message_cards')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(limit);

  if (rowsErr) {
    console.error('[messageCards] getMessageCards rows fetch error:', rowsErr);
    throw rowsErr;
  }

  const otherUserIds = Array.from(new Set((rows || []).map((r: any) => r.other_user_id).filter(Boolean)));
  let profilesMap: Record<string, any> = {};
  if (otherUserIds.length > 0) {
    // Fetch profiles using the canonical 'user_profile' table and map by id/user_id
    const { data: byId, error: byIdErr } = await supabase
      .from('user_profile')
      .select('id, user_id, username, display_name, avatar_url')
      .in('id', otherUserIds as string[]);

    let profiles = byId || [];
    if (byIdErr) {
      // try lookup by user_id as a compatibility fallback
      const { data: byUserId } = await supabase
        .from('user_profile')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', otherUserIds as string[]);
      profiles = byUserId || [];
    }

    profilesMap = (profiles || []).reduce((acc: any, p: any) => { acc[p.id || p.user_id] = p; return acc; }, {});
  }

  const enriched = (rows || []).map((r: any) => ({
    ...r,
    // Prefer explicit display_name then name then username for human-friendly label
    other_user: profilesMap[r.other_user_id] ? { id: profilesMap[r.other_user_id].id || profilesMap[r.other_user_id].user_id, name: profilesMap[r.other_user_id].display_name || profilesMap[r.other_user_id].username, username: profilesMap[r.other_user_id].username, display_name: profilesMap[r.other_user_id].display_name, avatar_url: profilesMap[r.other_user_id].avatar_url } : null,
  }));

  return enriched as MessageCard[];
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
            // Fetch canonical username/avatar from user_profile (prefer id, fallback to user_id)
            try {
              const { data: p1 } = await supabase.from('user_profile').select('id, user_id, username, avatar_url').eq('id', card.other_user_id).maybeSingle();
              let profile = p1 || null;
              if (!profile) {
                const { data: p2 } = await supabase.from('user_profile').select('id, user_id, username, avatar_url').eq('user_id', card.other_user_id).maybeSingle();
                profile = p2 || null;
              }
              if (profile) {
                const short = { id: profile.id || profile.user_id, username: profile.username, avatar_url: profile.avatar_url };
                if (payload.new) payload.new.other_user = short;
                if (payload.old) payload.old.other_user = short;
              }
            } catch (e) {
              // ignore enrichment errors; do not log to console to avoid noisy warnings
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
