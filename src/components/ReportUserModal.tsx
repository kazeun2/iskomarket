import React, { useState } from 'react'
import { Button } from './ui/button'
import { createReport } from '../lib/trustService'
import type { ReportReason } from '../types/trust'

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Harassment or abusive behavior' },
  { value: 'scam', label: 'Scam / payment issue' },
  { value: 'no_show', label: 'No-show or unreliable behavior' },
  { value: 'other', label: 'Other' },
]

export function ReportUserModal({ reportedUserId, open, onClose, reporterId, hasExistingTransaction=false, conversationId }: { reportedUserId: string; open: boolean; onClose: ()=>void; reporterId: string; hasExistingTransaction?: boolean; conversationId?: string }) {
  const [reason, setReason] = useState<ReportReason>('harassment')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string,string> = {}
    if (!description || description.trim().length < 10) e.description = 'Description is required (min 10 chars)'
    if (files.some(f => f.size > 5 * 1024 * 1024)) e.files = 'Each file must be <= 5MB'
    if (files.length > 3) e.files = 'Maximum 3 files'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onChooseFiles = (fl?: FileList | null) => {
    if (!fl) return
    const arr = Array.from(fl).slice(0,3)
    setFiles(arr)
  }

  const onSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await createReport({
        targetType: 'user',
        targetId: reportedUserId,
        reporterId,
        reportedUserId,
        reason,
        description,
        hasExistingTransaction: !!hasExistingTransaction,
        evidenceUrls: files.map(f => `mock://uploads/${f.name}`),
      })
      alert('Thank you. Your report has been submitted for review.')
      onClose()
    } catch (err) {
      console.error(err)
      setErrors((p)=>({ ...p, submit: 'Failed to submit report' }))
    } finally { setSubmitting(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg p-4 bg-white rounded">
        <h3 className="text-lg font-semibold">Report User</h3>
        <p className="text-sm text-muted-foreground">False reports may result in account restrictions.</p>

        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm">Reason</label>
            <select value={reason} onChange={(e)=>setReason(e.target.value as ReportReason)} className="w-full border rounded p-2">
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm">Description</label>
            <textarea className="w-full border rounded p-2" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Mention dates, meet-up attempts, and what the other user did." />
            {errors.description ? <div className="text-xs text-red-600">{errors.description}</div> : null}
          </div>

          <div>
            <label className="block text-sm">Proof (optional, up to 3 files)</label>
            <input type="file" accept="application/pdf,image/png,image/jpeg" multiple onChange={(e)=>onChooseFiles(e.target.files)} />
            {errors.files ? <div className="text-xs text-red-600">{errors.files}</div> : null}
            {files.length ? <div className="text-xs">Selected: {files.map(f=>f.name).join(', ')}</div> : null}
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
        </div>
        {errors.submit ? <div className="mt-2 text-sm text-red-600">{errors.submit}</div> : null}
      </div>
    </div>
  )
}