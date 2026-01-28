/**
 * Report Services
 * Last Updated: December 13, 2025
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

type ReportRow = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']
type ReportUpdate = Database['public']['Tables']['reports']['Update']

// Create a report
export async function createReport(report: ReportInsert) {
  const { data, error } = await supabase
    .from('reports')
    .insert(report)
    .select()
    .single()

  if (error) throw error
  return data as ReportRow
}

// Get user's reports
export async function getUserReports(userId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ReportRow[]
}

// Get report by ID
export async function getReport(id: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ReportRow
}

// Get all reports (admin only)
export async function getAllReports(status?: string) {
  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reporter_id(id, username),
      reported_user:users!reported_user_id(id, username)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// Update report status (admin only)
export async function updateReportStatus(
  id: string, 
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed',
  adminId?: string,
  adminNotes?: string,
  actionTaken?: string
) {
  const updates: ReportUpdate = {
    status,
    admin_notes: adminNotes,
    action_taken: actionTaken
  }

  if (status === 'resolved' || status === 'dismissed') {
    updates.resolved_at = new Date().toISOString()
    updates.resolved_by = adminId
  }

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Notify reporter
  if (data.reporter_id) {
    const { notifyReportUpdate } = await import('./notifications')
    await notifyReportUpdate(data.reporter_id, status, data.id)
  }

  return data as ReportRow
}

// Delete report (admin only)
export async function deleteReport(id: string) {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get report statistics (admin only)
export async function getReportStatistics() {
  const { count: totalReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })

  const { count: pendingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: reviewingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'reviewing')

  const { count: resolvedReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved')

  const { count: dismissedReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'dismissed')

  return {
    total: totalReports || 0,
    pending: pendingReports || 0,
    reviewing: reviewingReports || 0,
    resolved: resolvedReports || 0,
    dismissed: dismissedReports || 0
  }
}

// Report helpers for common scenarios

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: string,
  description: string,
  evidenceUrls?: string[]
) {
  return createReport({
    reporter_id: reporterId,
    reported_type: 'user',
    reported_id: reportedUserId,
    reported_user_id: reportedUserId,
    reason,
    description,
    evidence_urls: evidenceUrls || []
  })
}

export async function reportProduct(
  reporterId: string,
  productId: string,
  sellerId: string,
  reason: string,
  description: string,
  evidenceUrls?: string[]
) {
  return createReport({
    reporter_id: reporterId,
    reported_type: 'product',
    reported_id: productId,
    reported_user_id: sellerId,
    reason,
    description,
    evidence_urls: evidenceUrls || []
  })
}

export async function reportMessage(
  reporterId: string,
  messageId: string,
  senderId: string,
  reason: string,
  description: string,
  evidenceUrls?: string[]
) {
  return createReport({
    reporter_id: reporterId,
    reported_type: 'message',
    reported_id: messageId,
    reported_user_id: senderId,
    reason,
    description,
    evidence_urls: evidenceUrls || []
  })
}

export async function reportReview(
  reporterId: string,
  reviewId: string,
  reviewerId: string,
  reason: string,
  description: string,
  evidenceUrls?: string[]
) {
  return createReport({
    reporter_id: reporterId,
    reported_type: 'review',
    reported_id: reviewId,
    reported_user_id: reviewerId,
    reason,
    description,
    evidence_urls: evidenceUrls || []
  })
}