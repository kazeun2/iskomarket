import React, { useState } from 'react'
import type { AppealReason } from '../lib/chat/types'

export default function AppealModal({ onSubmit, onCancel }: { onSubmit: (payload: { reason: AppealReason; description?: string }) => void; onCancel: () => void }) {
  const [reason, setReason] = useState<AppealReason>('forgot_to_click')
  const [description, setDescription] = useState('')

  return (
    <div className="p-4 border rounded bg-card">
      <h3 className="font-bold">Submit Appeal</h3>
      <div className="mt-2">
        <label className="block text-sm">Reason</label>
        <select value={reason} onChange={(e) => setReason(e.target.value as AppealReason)}>
          <option value="forgot_to_click">Forgot to click</option>
          <option value="met_but_issue">Met but issue</option>
          <option value="technical_issue">Technical issue</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mt-2">
        <label className="block text-sm">Description (optional)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full" />
      </div>

      <div className="mt-2 flex gap-2">
        <button className="btn btn-primary" onClick={() => onSubmit({ reason, description: description || undefined })}>Submit</button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
