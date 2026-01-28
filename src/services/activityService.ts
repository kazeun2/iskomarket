import { supabase } from '../lib/supabase';
import { formatNotificationTime } from '../utils/timeUtils';
import { getRecentSystemLogs, subscribeToSystemLogs } from './systemLogService';

export interface Activity {
  id?: string;
  type: string;
  sub_type?: string;
  action: string;
  user?: string;
  details?: string;
  created_at?: string;
  // UI helpers
  time?: string;
}

function deriveActionFromRow(row: any) {
  if (row.action) return row.action;
  if (row.type === 'registration') return 'New User Registration';
  if (row.type === 'transaction') return 'Transaction Completed';
  if (row.type === 'product') return 'Product event';
  if (row.type === 'report') return 'Report Submitted';
  if (row.type === 'review') return 'Review Posted';
  return row.type || 'Activity';
}

export async function getTodaysActivities() {
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      // If the activities table is not present on this project, fallback to system_logs and map them into activities
      const msg = (error as any)?.message || '';
      if (msg.includes("Could not find the table") || (error as any)?.code === 'PGRST205') {
        console.warn('Activities table not found in Supabase - falling back to system_logs for activities');

        // Pull recent system logs for today and map to activities
        const { data: logs, error: logsErr } = await getRecentSystemLogs({ sinceDays: 1, limit: 1000, offset: 0 });
        if (logsErr) {
          console.error('Error fetching fallback system_logs for activities:', logsErr);
          return { data: [], error: null };
        }

        const fallback = (logs || []).map((r: any, idx: number) => {
          const createdAt = r.created_at || new Date().toISOString();
          return {
            id: String(r.id ?? `${createdAt}_${idx}`),
            type: r.category || r.type || 'activity',
            sub_type: r.subType || r.sub_type,
            action: r.summary || r.action || r.type || 'Activity',
            user: r.source || r.user || 'System',
            details: JSON.stringify(r.details || {}),
            created_at: createdAt,
            time: formatNotificationTime(createdAt),
          } as Activity;
        });

        return { data: fallback, error: null };
      }

      console.error('Error fetching todays activities:', error);
      return { data: null, error };
    }

    // Normalize rows to the UI shape and ensure stable ids for deduping
    const normalized = (data || []).map((row: any, idx: number) => {
      const createdAt = row.created_at || new Date().toISOString();
      const id = String(row.id ?? row.activity_id ?? `${createdAt}_${idx}`);
      const action = deriveActionFromRow(row);
      const user = row.user || row.username || (row.user_id ? String(row.user_id) : 'Unknown');
      return {
        id,
        type: row.type || row.action || 'activity',
        sub_type: row.sub_type,
        action,
        user,
        details: row.details || row.payload || '',
        created_at: createdAt,
        time: formatNotificationTime(createdAt),
      } as Activity;
    });

    return { data: normalized, error: null };
  } catch (error) {
    console.error('Unexpected error fetching todays activities:', error);
    return { data: null, error };
  }
}

export function subscribeToActivities(callback: (activities: Activity[]) => void) {
  // Try to subscribe directly to the activities table; but if the table isn't available, subscribe to system_logs as a fallback
  const channel = supabase
    .channel('activities_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activities',
      },
      async () => {
        const { data } = await getTodaysActivities();
        if (data) {
          callback(data);
        }
      }
    )
    .subscribe();

  // Also set up a fallback subscription to system_logs so we keep real-time updates when activities table is absent
  const fallbackUnsub = subscribeToSystemLogs(async (logs) => {
    // Map logs to activities shape and invoke callback
    const mapped = (logs || []).map((r: any, idx: number) => {
      const createdAt = r.created_at || new Date().toISOString();
      return {
        id: String(r.id ?? `${createdAt}_${idx}`),
        type: r.category || r.type || 'activity',
        sub_type: r.subType || r.sub_type,
        action: r.summary || r.action || r.type || 'Activity',
        user: r.source || r.user || 'System',
        details: JSON.stringify(r.details || {}),
        created_at: createdAt,
        time: formatNotificationTime(createdAt),
      } as Activity;
    });

    callback(mapped);
  });

  return () => {
    try { supabase.removeChannel(channel); } catch (e) { /* ignore */ }
    try { if (fallbackUnsub) fallbackUnsub(); } catch (e) { /* ignore */ }
  };
}
