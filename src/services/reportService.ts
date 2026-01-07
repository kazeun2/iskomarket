import { supabase } from '../lib/supabase';

export interface Report {
  id?: string;
  type: 'user' | 'product';
  reported_item_id: string;
  reported_item_name: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  description: string;
  proof_urls?: string[];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at?: string;
  updated_at?: string;
}

/**
 * Submit a new report
 */
export async function submitReport(report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // Map client report shape to DB columns (the DB uses different names)
    const insertPayload: any = {
      reported_type: report.type,
      reported_id: report.reported_item_id,
      reporter_id: report.reporter_id,
      reason: report.reason,
      description: report.description,
      evidence_urls: report.proof_urls || [],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('reports')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error('Error submitting report:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error submitting report:', error);
    return { data: null, error };
  }
}

/**
 * Get all reports (admin only)
 */
export async function getAllReports() {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching reports:', error);
    return { data: null, error };
  }
}

/**
 * Get pending reports (admin only)
 */
export async function getPendingReports() {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending reports:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching pending reports:', error);
    return { data: null, error };
  }
}

/**
 * Update report status (admin only)
 */
export async function updateReportStatus(reportId: string, status: Report['status']) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating report status:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating report status:', error);
    return { data: null, error };
  }
}

/**
 * Subscribe to reports changes (admin only)
 */
export function subscribeToReports(callback: (reports: Report[]) => void) {
  const channel = supabase
    .channel('reports_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reports',
      },
      async () => {
        // Fetch updated reports
        const { data } = await getPendingReports();
        if (data) {
          callback(data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Upload report proof files to Supabase Storage
 */
export async function uploadReportProof(files: File[], reportId: string) {
  const uploadedUrls: string[] = [];

  try {
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reportId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('report-proofs')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        continue;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('report-proofs')
        .getPublicUrl(fileName);

      // Compatibility: publicData may be { publicUrl } or nested differently depending on SDK
      const publicUrl = (publicData as any)?.publicUrl || (publicData as any)?.public_url || '';

      if (publicUrl) uploadedUrls.push(publicUrl);
    }

    return { data: uploadedUrls, error: null };
  } catch (error) {
    console.error('Unexpected error uploading files:', error);
    return { data: [], error };
  }
}

/**
 * Update a report with proof URLs (used after uploading files)
 */
export async function updateReportProofs(reportId: string, proofUrls: string[]) {
  try {
    // DB column is `evidence_urls`
    const { data, error } = await supabase
      .from('reports')
      .update({ evidence_urls: proofUrls, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating report proofs:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating report proofs:', error);
    return { data: null, error };
  }
}
