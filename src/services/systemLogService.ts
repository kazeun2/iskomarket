import { supabase } from '../lib/supabase';
import { formatNotificationTime } from '../utils/timeUtils';

export type Category = 'transaction' | 'credit' | 'error' | 'slow';
export type Severity = 'INFO' | 'SUCCESS' | 'ERROR' | 'SLOW';

export interface SystemLogRow {
  id?: string;
  category: Category;
  type: string;
  severity: Severity;
  source: string;
  summary: string;
  details?: any;
  created_at?: string;
}

export interface SystemLogUI {
  id: string;
  category: Category;
  type: string;
  severity: Severity;
  source: string;
  summary: string;
  details?: any;
  created_at: string;
  time: string; // formatted '2m ago'
}

export async function getRecentSystemLogs(opts?: { sinceDays?: number; limit?: number; offset?: number; category?: Category; severity?: Severity }) {
  const sinceDays = opts?.sinceDays ?? 7;
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  try {
    // Use range for pagination for broader PostgREST compatibility
    const start = offset;
    const end = Math.max(0, offset + limit - 1);

    let query = supabase
      .from('system_logs')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .range(start, end);

    if (opts?.category) query = query.eq('category', opts.category);
    if (opts?.severity) query = query.eq('severity', opts.severity);

    const { data, error } = await query;

    if (error) {
      const msg = (error as any)?.message || '';
      // Graceful handling if table missing
      if (msg.includes("Could not find the table") || (error as any)?.code === 'PGRST205') {
        console.warn('system_logs table not found in Supabase - skipping logs fetch');
        return { data: [], error: null };
      }

      console.error('Error fetching system logs:', error);
      return { data: null, error };
    }

    const normalized = (data || []).map((r: any, idx: number) => {
      const createdAt = r.created_at || new Date().toISOString();
      const id = String(r.id ?? `${createdAt}_${idx}`);
      return {
        id,
        category: r.category,
        type: r.type,
        severity: r.severity,
        source: r.source,
        summary: r.summary,
        details: r.details,
        created_at: createdAt,
        time: formatNotificationTime(createdAt),
      } as SystemLogUI;
    });

    return { data: normalized, error: null };
  } catch (error) {
    console.error('Unexpected error fetching system logs:', error);
    return { data: null, error };
  }
}

export function subscribeToSystemLogs(callback: (logs: SystemLogUI[]) => void) {
  const channel = supabase
    .channel('system_logs_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'system_logs',
      },
      async () => {
        const { data } = await getRecentSystemLogs({ sinceDays: 7, limit: 50 });
        if (data) callback(data);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * insertSystemLog
 *
 * Note: `system_logs` may have Row Level Security (RLS) enabled in some
 * environments. The anon/auth roles may not be allowed to INSERT. Logging
 * failures (RLS/permission errors) are treated as non-fatal and should not
 * block primary user actions (e.g., posting products).
 */
export async function insertSystemLog(row: Omit<SystemLogRow, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .insert([row])
      .select()
      .single();

    if (error) {
      // Detect common permission / RLS related messages and treat them as non-fatal
      const msg = String((error as any)?.message || '').toLowerCase();
      const isRls = msg.includes('row-level') || msg.includes('row level') || msg.includes('violates row-level') || msg.includes('permission') || (error as any)?.status === 403;

      if (isRls) {
        // Warn but do not escalate
        console.warn('System log insert failed (non-fatal - possible RLS/permission):', error);
        return { data: null, error: null };
      }

      // Otherwise surface as an error for debugging but still do not throw
      console.error('Error inserting system log:', error);
      return { data: null, error };
    }

    // Normalize single row
    const createdAt = (data as any).created_at;
    const id = String((data as any).id);
    const ui: SystemLogUI = {
      id,
      category: (data as any).category,
      type: (data as any).type,
      severity: (data as any).severity,
      source: (data as any).source,
      summary: (data as any).summary,
      details: (data as any).details,
      created_at: createdAt,
      time: formatNotificationTime(createdAt),
    };

    return { data: ui, error: null };
  } catch (error) {
    // Unexpected exceptions in logging should not block user flows; surface as a warning
    console.warn('Unexpected error inserting system log (non-fatal):', error);
    return { data: null, error: null };
  }
}

export async function getSystemLogCounts() {
  try {
    const categories: Category[] = ['transaction', 'credit', 'error', 'slow'];
    const results: Record<string, number> = {};

    for (const c of categories) {
      const { count } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString())
        .eq('category', c);

      results[c] = count || 0;
    }

    return { data: results, error: null };
  } catch (error) {
    console.error('Unexpected error fetching system log counts:', error);
    return { data: null, error };
  }
}
