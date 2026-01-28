import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { createReport } from '../lib/trustService'
import type { ReportReason } from '../types/trust'

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'scam', label: 'Scam or misleading listing' },
  { value: 'fake_cause_proof', label: 'Fake “For a Cause” proof' },
  { value: 'inappropriate_content', label: 'Inappropriate or unsafe content' },
  { value: 'other', label: 'Other' },
]

export function ReportProductModal({ productId, productTitle, productSellerId, open, onClose, reporterId, hasExistingTransaction=false }: { productId: string; productTitle: string; productSellerId?: string; open: boolean; onClose: ()=>void; reporterId: string; hasExistingTransaction?: boolean }) {
  const [reason, setReason] = useState<ReportReason>('scam')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string,string> = {}
    if (!reason) e.reason = 'Please select a reason'
    if (reason === 'other') {
      if (!description || description.trim().length < 20) e.description = 'Please provide at least 20 characters when selecting Other'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await createReport({
        targetType: 'product',
        targetId: productId,
        reporterId,
        reportedUserId: productSellerId,
        reason,
        description,
        hasExistingTransaction: !!hasExistingTransaction,
        evidenceUrls: [],
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
        <h3 className="text-lg font-semibold">Report Product</h3>
        <p className="text-sm text-muted-foreground">Help us maintain a safe marketplace by reporting inappropriate products.</p>

        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm">Reason for reporting</label>
            <select value={reason} onChange={(e)=>setReason(e.target.value as ReportReason)} className="w-full border rounded p-2">
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {errors.reason ? <div className="text-xs text-red-600">{errors.reason}</div> : null}
          </div>

          <div>
            <label className="block text-sm">Additional details</label>
            <textarea className="w-full border rounded p-2" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Include what happened, including any meet-up or payment details." />
            {errors.description ? <div className="text-xs text-red-600">{errors.description}</div> : null}
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