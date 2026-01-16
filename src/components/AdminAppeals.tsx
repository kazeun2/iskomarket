import React from 'react'
import { useConversations } from '../contexts/ConversationContext'

export default function AdminAppeals({ transactionOnly = false }: { transactionOnly?: boolean }) {
  const ctx = useConversations()
  const appeals = Object.values(ctx.appeals).filter((a) => !transactionOnly || !!a.transactionId)

  if (!appeals.length) return <div>{transactionOnly ? 'No transaction appeals yet' : 'No appeals yet'}</div>

  return (
    <div className="p-4">
      <h3 className="font-bold">Appeals (Admin)</h3>
      <div className="grid gap-2 mt-2">
        {appeals.map((a) => (
          <div key={a.id} className="border rounded p-3 bg-white">
            <div className="text-sm font-medium">Reason: {a.reason}</div>
            <div className="text-xs text-muted">By: {a.submittedById} • {new Date(a.createdAt).toLocaleString()}</div>
            <div className="mt-2">{a.description}</div>
            <div className="mt-2 flex gap-2">
              <button className="btn btn-primary" onClick={() => ctx.adminApproveAppeal(a.id)}>Approve</button>
              <button className="btn" onClick={() => ctx.adminDismissAppeal(a.id)}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
