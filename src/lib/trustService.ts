import type { ForCauseDetails, Report, ReportStatus, ReportReason, CauseStatus, ReportTargetType } from '../types/trust'
import { supabase, isSupabaseConfigured } from './supabase'
import * as productService from './services/products'
import * as reportService from '../services/reportService'

/**
 * Trust / moderation related service backed by Supabase when available.
 * Falls back to in-memory mocks when Supabase is not configured (dev/testing).
 */
// In-memory mock stores (dev only)
const causeStore: Record<string, ForCauseDetails> = {}
const reportStore: Record<string, Report> = {}

let idCounter = 1
function makeId(prefix = '') { return `${prefix}${Date.now().toString(36)}${(idCounter++).toString(36)}` }

export async function createProduct(product: { title: string; description: string; price: number; category: string; images?: string[]; sellerId?: string; preferredMeetupLocation?: string | null }) {
  if (isSupabaseConfigured()) {
    // Reuse central product service which enforces auth and RLS expectations
    return await productService.createProduct(product as any)
  }

  // Mock product creation - returns a product object with id
  const id = makeId('prod_')
  return { id, ...product }
}

export async function createForCauseDetails(payload: Omit<ForCauseDetails, 'id' | 'status' | 'createdAt'> & { status?: CauseStatus }) {
  // If Supabase available, try to insert into a dedicated table `for_cause_details` (if present).
  // Fallback behavior: update the product row with `is_for_cause` and cause metadata so the UI can still reflect the submission.
  if (isSupabaseConfigured()) {
    try {
      const insertPayload: any = {
        product_id: payload.productId,
        seller_id: payload.sellerId,
        fundraising_cause: payload.fundraisingCause,
        organization_name: payload.organizationName || null,
        fundraising_goal: payload.fundraisingGoal,
        verification_document_url: payload.verificationDocumentUrl,
        verification_document_name: payload.verificationDocumentName,
        cause_type: payload.causeType,
        status: payload.status || 'pending',
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('for_cause_details')
        .insert([insertPayload])
        .select()
        .single()

      if (error) {
        // If the table doesn't exist or insert failed, attempt fallback to product update
        console.warn('createForCauseDetails: insert to for_cause_details failed, falling back to products update:', error.message || error)
        // Update the product row to mark it as for a cause and store some metadata
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .update({ is_for_cause: true, cause_organization: payload.organizationName || null, goal_amount: payload.fundraisingGoal })
          .eq('id', payload.productId)
          .select()
          .single()

        if (prodErr) throw prodErr

        // Compose a ForCauseDetails-like object from product update result
        return {
          id: `prod_${prod.id}`,
          productId: String(payload.productId),
          sellerId: String(payload.sellerId),
          fundraisingCause: payload.fundraisingCause,
          organizationName: payload.organizationName,
          fundraisingGoal: payload.fundraisingGoal,
          verificationDocumentUrl: payload.verificationDocumentUrl,
          verificationDocumentName: payload.verificationDocumentName,
          causeType: payload.causeType,
          status: payload.status || 'pending',
          createdAt: new Date().toISOString(),
        } as ForCauseDetails
      }

      // Map DB row to ForCauseDetails shape (normalize column names)
      return {
        id: (data as any).id,
        productId: (data as any).product_id,
        sellerId: (data as any).seller_id,
        fundraisingCause: (data as any).fundraising_cause,
        organizationName: (data as any).organization_name,
        fundraisingGoal: Number((data as any).fundraising_goal || 0),
        verificationDocumentUrl: (data as any).verification_document_url,
        verificationDocumentName: (data as any).verification_document_name,
        causeType: (data as any).cause_type,
        status: (data as any).status,
        adminNotes: (data as any).admin_notes || undefined,
        createdAt: (data as any).created_at,
        reviewedAt: (data as any).reviewed_at || undefined,
      } as ForCauseDetails
    } catch (err: any) {
      console.error('createForCauseDetails error (supabase):', err)
      throw err
    }
  }

  // Fallback mock behavior
  const id = makeId('cause_')
  const now = new Date().toISOString()
  const record: ForCauseDetails = {
    id,
    ...payload,
    status: payload.status || 'pending',
    createdAt: now,
  }
  causeStore[id] = record
  return record
}

export async function getPendingForCauseDetails() {
  if (isSupabaseConfigured()) {
    try {
      // Prefer dedicated table if present
      const { data, error } = await supabase
        .from('for_cause_details')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('getPendingForCauseDetails: for_cause_details query failed, returning empty list:', error.message || error)
        return []
      }
      return (data || []).map((d: any) => ({
        id: d.id,
        productId: d.product_id,
        sellerId: d.seller_id,
        fundraisingCause: d.fundraising_cause,
        organizationName: d.organization_name,
        fundraisingGoal: Number(d.fundraising_goal || 0),
        verificationDocumentUrl: d.verification_document_url,
        verificationDocumentName: d.verification_document_name,
        causeType: d.cause_type,
        status: d.status,
        adminNotes: d.admin_notes || undefined,
        createdAt: d.created_at,
        reviewedAt: d.reviewed_at || undefined,
      })) as ForCauseDetails[]
    } catch (err) {
      console.error('getPendingForCauseDetails error:', err)
      return []
    }
  }

  return Object.values(causeStore).filter((c) => c.status === 'pending')
}

export async function updateCauseStatus(id: string, status: CauseStatus, adminNotes?: string) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('for_cause_details')
        .update({ status, admin_notes: adminNotes || null, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('updateCauseStatus: supabase update error:', error)
        throw error
      }

      // If approved, also ensure the product row reflects for-a-cause status (best-effort)
      if ((data as any).status === 'approved' && (data as any).product_id) {
        try {
          await supabase.from('products').update({ is_for_cause: true, cause_organization: (data as any).organization_name, goal_amount: (data as any).fundraising_goal }).eq('id', (data as any).product_id)
        } catch (e) {
          console.warn('updateCauseStatus: failed to update product metadata after approval', e)
        }
      }
      return {
        id: (data as any).id,
        productId: (data as any).product_id,
        sellerId: (data as any).seller_id,
        fundraisingCause: (data as any).fundraising_cause,
        organizationName: (data as any).organization_name,
        fundraisingGoal: Number((data as any).fundraising_goal || 0),
        verificationDocumentUrl: (data as any).verification_document_url,
        verificationDocumentName: (data as any).verification_document_name,
        causeType: (data as any).cause_type,
        status: (data as any).status,
        adminNotes: (data as any).admin_notes || undefined,
        createdAt: (data as any).created_at,
        reviewedAt: (data as any).reviewed_at || undefined,
      } as ForCauseDetails
    } catch (err) {
      console.error('updateCauseStatus error:', err)
      throw err
    }
  }
  const rec = causeStore[id]
  if (!rec) throw new Error('Not found')
  rec.status = status
  rec.adminNotes = adminNotes
  rec.reviewedAt = new Date().toISOString()
  causeStore[id] = rec
  return rec
}

export async function createReport(report: Omit<Report, 'id' | 'status' | 'createdAt'>) {
  // If supabase is configured, delegate to central reportService which maps client->DB column names and uploads evidence
  if (isSupabaseConfigured()) {
    try {
      // Map our Report shape to reportService.submitReport expectations
      const payload: any = {
        type: report.targetType === 'user' ? 'user' : 'product',
        reported_item_id: report.targetId,
        reporter_id: report.reporterId,
        reason: report.reason,
        description: report.description,
        proof_urls: report.evidenceUrls || []
      }
      const res = await reportService.submitReport(payload)
      if (res.error) throw res.error
      const created = res.data
      return {
        id: created.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reporterId: report.reporterId,
        reportedUserId: report.reportedUserId,
        reason: report.reason,
        description: report.description,
        hasExistingTransaction: report.hasExistingTransaction || false,
        evidenceUrls: report.evidenceUrls || [],
        status: 'pending',
        createdAt: created.created_at || new Date().toISOString(),
      } as Report
    } catch (err) {
      console.error('createReport error:', err)
      throw err
    }
  }
  const id = makeId('report_')
  const now = new Date().toISOString()
  const r: Report = {
    id,
    ...report,
    status: 'pending',
    createdAt: now,
  }
  reportStore[id] = r
  return r
}

export async function getReports(filter?: { targetType?: ReportTargetType; status?: ReportStatus }) {
  if (isSupabaseConfigured()) {
    try {
      // Use central reportService to fetch pending/admin reports
      const { data, error } = await reportService.getAllReports()
      if (error) {
        console.error('getReports: reportService.getAllReports error:', error)
        return []
      }
      let rows: any[] = data || []
      if (filter?.status) rows = rows.filter((r) => r.status === filter.status)
      if (filter?.targetType) rows = rows.filter((r) => (filter.targetType === 'user' ? r.type === 'user' : r.type === 'product'))
      return rows.map((r: any) => ({
        id: r.id,
        targetType: r.type === 'user' ? 'user' : 'product',
        targetId: r.reported_id || r.reported_product_id || r.reported_item_id,
        reporterId: r.reporter_id,
        reportedUserId: r.reported_user_id || r.reported_user_id,
        reason: r.reason,
        description: r.description,
        hasExistingTransaction: r.has_existing_transaction || false,
        evidenceUrls: r.evidence_urls || r.proof_urls || [],
        status: r.status === 'pending' ? 'pending' : (r.status === 'reviewed' || r.status === 'resolved' ? 'reviewed_valid' : r.status === 'dismissed' ? 'reviewed_invalid' : r.status),
        adminNotes: r.admin_notes || undefined,
        createdAt: r.created_at,
        reviewedAt: r.updated_at || r.reviewed_at || undefined,
      })) as Report[]
    } catch (err) {
      console.error('getReports error:', err)
      return []
    }
  }
  return Object.values(reportStore).filter((r) => {
    if (filter?.targetType && r.targetType !== filter.targetType) return false
    if (filter?.status && r.status !== filter.status) return false
    return true
  })
}

export async function updateReportStatus(id: string, status: ReportStatus, adminNotes?: string) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await reportService.updateReportStatus(id, status === 'pending' ? 'pending' : status === 'reviewed_valid' ? 'reviewed' : 'dismissed')
      if (error) throw error
      const updated = data
      return {
        id: updated.id,
        targetType: updated.type === 'user' ? 'user' : 'product',
        targetId: updated.reported_id || updated.reported_item_id || updated.reported_product_id,
        reporterId: updated.reporter_id,
        reportedUserId: updated.reported_user_id || undefined,
        reason: updated.reason,
        description: updated.description,
        hasExistingTransaction: updated.has_existing_transaction || false,
        evidenceUrls: updated.evidence_urls || updated.proof_urls || [],
        status: updated.status === 'pending' ? 'pending' : (updated.status === 'reviewed' || updated.status === 'resolved' ? 'reviewed_valid' : 'reviewed_invalid'),
        adminNotes: updated.admin_notes || undefined,
        createdAt: updated.created_at,
        reviewedAt: updated.updated_at || updated.reviewed_at || undefined,
      } as Report
    } catch (err) {
      console.error('updateReportStatus error:', err)
      throw err
    }
  }
  const rec = reportStore[id]
  if (!rec) throw new Error('Not found')
  rec.status = status
  rec.adminNotes = adminNotes
  rec.reviewedAt = new Date().toISOString()
  reportStore[id] = rec
  return rec
}

export function subscribeToForCauseChanges(callback: (items: ForCauseDetails[]) => void) {
  if (!isSupabaseConfigured()) return () => {}
  const channel = supabase
    .channel('for_cause_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'for_cause_details' }, async () => {
      const items = await getPendingForCauseDetails()
      callback(items)
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// Exported for admin UI mocking
export const __debug__ = { causeStore, reportStore }