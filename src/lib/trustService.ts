import type { ForCauseDetails, Report, ReportStatus, ReportReason, CauseStatus, ReportTargetType } from '../types/trust'

// In-memory mock stores (dev only)
const causeStore: Record<string, ForCauseDetails> = {}
const reportStore: Record<string, Report> = {}

let idCounter = 1
function makeId(prefix = '') { return `${prefix}${Date.now().toString(36)}${(idCounter++).toString(36)}` }

export async function createProduct(product: { title: string; description: string; price: number; category: string; images?: string[]; sellerId?: string; preferredMeetupLocation?: string | null }) {
  // Mock product creation - returns a product object with id
  const id = makeId('prod_')
  return { id, ...product }
}

export async function createForCauseDetails(payload: Omit<ForCauseDetails, 'id' | 'status' | 'createdAt'> & { status?: CauseStatus }) {
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
  return Object.values(causeStore).filter((c) => c.status === 'pending')
}

export async function updateCauseStatus(id: string, status: CauseStatus, adminNotes?: string) {
  const rec = causeStore[id]
  if (!rec) throw new Error('Not found')
  rec.status = status
  rec.adminNotes = adminNotes
  rec.reviewedAt = new Date().toISOString()
  causeStore[id] = rec
  return rec
}

export async function createReport(report: Omit<Report, 'id' | 'status' | 'createdAt'>) {
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
  return Object.values(reportStore).filter((r) => {
    if (filter?.targetType && r.targetType !== filter.targetType) return false
    if (filter?.status && r.status !== filter.status) return false
    return true
  })
}

export async function updateReportStatus(id: string, status: ReportStatus, adminNotes?: string) {
  const rec = reportStore[id]
  if (!rec) throw new Error('Not found')
  rec.status = status
  rec.adminNotes = adminNotes
  rec.reviewedAt = new Date().toISOString()
  reportStore[id] = rec
  return rec
}

// Exported for admin UI mocking
export const __debug__ = { causeStore, reportStore }