import { supabase } from '../lib/supabase';
import { formatNotificationTime } from '../utils/timeUtils';

export type AdminAuditAction = 'deleted' | 'suspended' | 'approved' | 'declined' | 'warned' | 'removed';
export type AdminAuditTarget = 'product' | 'user' | 'fundraiser' | 'for_a_cause' | 'account';

export interface AdminAuditRow {
  id?: string;
  admin_id?: string | null;
  admin_email?: string | null;
  action: AdminAuditAction;
  target_type: AdminAuditTarget;
  target_id?: string | null;
  target_title?: string | null;
  reason?: string | null;
  metadata?: any;
  created_at?: string;
}

export interface AdminAuditUI {
  id: string;
  adminId?: string | null;
  adminEmail?: string | null;
  action: AdminAuditAction;
  targetType: AdminAuditTarget;
  targetId?: string | null;
  targetTitle?: string | null;
  reason?: string | null;
  metadata?: any;
  created_at: string;
  date: string;
  time: string;
}

export async function getRecentAdminAuditLogs(opts?: { sinceDays?: number; limit?: number; offset?: number; action?: AdminAuditAction }) {
  const sinceDays = opts?.sinceDays ?? 7;
  const limit = opts?.limit ?? 200;
  const offset = opts?.offset ?? 0;

  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  try {
    const start = offset;
    const end = Math.max(0, offset + limit - 1);

    let query = supabase
      .from('admin_audit_logs')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .range(start, end);

    if (opts?.action) query = query.eq('action', opts.action);

    const { data, error } = await query;

    if (error) {
      const msg = (error as any)?.message || '';
      if (msg.includes('Could not find the table') || (error as any)?.code === 'PGRST205') {
        console.warn('admin_audit_logs table not found in Supabase - skipping logs fetch');
        return { data: [], error: null };
      }
      console.error('Error fetching admin audit logs:', error);
      return { data: null, error };
    }

    const normalized = (data || []).map((r: any, idx: number) => {
      const createdAt = r.created_at || new Date().toISOString();
      const id = String(r.id ?? `${createdAt}_${idx}`);
      const d = new Date(createdAt);
      return {
        id,
        adminId: r.admin_id ?? null,
        adminEmail: r.admin_email ?? null,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id ?? null,
        targetTitle: r.target_title ?? null,
        reason: r.reason ?? null,
        metadata: r.metadata ?? null,
        created_at: createdAt,
        date: d.toISOString().split('T')[0],
        time: formatNotificationTime(createdAt),
      } as AdminAuditUI;
    });

    return { data: normalized, error: null };
  } catch (error) {
    console.error('Unexpected error fetching admin audit logs:', error);
    return { data: null, error };
  }
}

export function subscribeToAdminAuditLogs(callback: (logs: AdminAuditUI[]) => void) {
  const channel = supabase
    .channel('admin_audit_logs_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'admin_audit_logs',
      },
      async () => {
        const { data } = await getRecentAdminAuditLogs({ sinceDays: 7, limit: 200 });
        if (data) callback(data);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function insertAdminAuditLog(row: Omit<AdminAuditRow, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('Error inserting admin audit log:', error);
      return { data: null, error };
    }

    const createdAt = (data as any).created_at;
    const id = String((data as any).id);

    const ui: AdminAuditUI = {
      id,
      adminId: (data as any).admin_id ?? null,
      adminEmail: (data as any).admin_email ?? null,
      action: (data as any).action,
      targetType: (data as any).target_type,
      targetId: (data as any).target_id ?? null,
      targetTitle: (data as any).target_title ?? null,
      reason: (data as any).reason ?? null,
      metadata: (data as any).metadata ?? null,
      created_at: createdAt,
      date: new Date(createdAt).toISOString().split('T')[0],
      time: formatNotificationTime(createdAt),
    };

    return { data: ui, error: null };
  } catch (error) {
    console.error('Unexpected error inserting admin audit log:', error);
    return { data: null, error };
  }
}
