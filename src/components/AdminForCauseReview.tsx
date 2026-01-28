import React, { useEffect, useState } from 'react'
import { getPendingForCauseDetails, updateCauseStatus, subscribeToForCauseChanges } from '../lib/trustService'
import { Button } from './ui/button'
import { ForCauseBadge } from './ForCauseBadge'

export function AdminForCauseReview() {
  const [items, setItems] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const load = async () => {
    const p = await getPendingForCauseDetails()
    setItems(p)
  }

  useEffect(()=>{
    // Initial load + subscribe to realtime changes so the admin list updates automatically
    load()
    const unsub = subscribeToForCauseChanges(setItems)
    return () => unsub()
  }, [])

  const onView = (it: any) => setSelected(it)

  const onApprove = async () => {
    if (!selected) return
    await updateCauseStatus(selected.id, 'approved')
    setSelected(null)
    await load()
  }

  const onReject = async () => {
    if (!selected) return
    if (!rejectionReason.trim()) return alert('Please enter a reason for rejection')
    await updateCauseStatus(selected.id, 'rejected', rejectionReason)
    setRejectionReason('')
    setSelected(null)
    await load()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">For a Cause Review</h3>
      <div className="bg-card rounded shadow p-3">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th>Product</th><th>Seller</th><th>Cause</th><th>Org</th><th>Submitted</th><th></th></tr></thead>
          <tbody>
            {items.map(it=> (
              <tr key={it.id} className="border-t"><td>{it.productId}</td><td>{it.sellerId}</td><td>{it.fundraisingCause.slice(0,40)}{it.fundraisingCause.length>40?'…':''}</td><td>{it.organizationName||'-'}</td><td>{new Date(it.createdAt).toLocaleString()}</td><td><Button onClick={()=>onView(it)}>View</Button></td></tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="text-sm text-muted-foreground">No pending items</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-11/12 max-w-3xl p-4 bg-card rounded">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold">Review For a Cause</h4>
              <div><ForCauseBadge status={selected.status} forSeller={true} /></div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Product</div>
                <div className="mt-1">ID: {selected.productId}</div>
                <div className="mt-2 text-sm">Cause: {selected.fundraisingCause}</div>
                <div className="mt-2 text-sm">Goal: ₱{selected.fundraisingGoal}</div>
                <div className="mt-2 text-sm">Organization: {selected.organizationName || '-'}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Verification document</div>
                <div className="mt-1"><a target="_blank" rel="noreferrer" href={selected.verificationDocumentUrl}>{selected.verificationDocumentName || 'Open document'}</a></div>
              </div>
            </div>

            <div className="mt-4">
              <Button variant="ghost" onClick={()=>setSelected(null)}>Close</Button>
              <Button className="ml-2" onClick={onApprove}>Approve</Button>
              <Button className="ml-2" variant="destructive" onClick={()=>{ if (!rejectionReason) { const r = prompt('Reason for rejection (required)'); if (r) setRejectionReason(r); else return } onReject() }}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
