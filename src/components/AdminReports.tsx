import React, { useEffect, useState } from 'react'
import { getReports, updateReportStatus } from '../lib/trustService'
import { subscribeToReports } from '../services/reportService'
import { Button } from './ui/button'

export function AdminReports() {
  const [tab, setTab] = useState<'products'|'users'>('products')
  const [rows, setRows] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)

  const load = async () => {
    const r = await getReports()
    setRows(r)
  }
  useEffect(()=>{
    load()
    const unsub = subscribeToReports(()=> load())
    return () => { if (unsub) unsub() }
  }, [])

  const view = (r:any) => setSelected(r)

  const mark = async (status: 'reviewed_valid' | 'reviewed_invalid' | 'spam') => {
    if (!selected) return
    await updateReportStatus(selected.id, status)
    setSelected(null)
    await load()
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Reports</h3>
      <div className="mt-3 space-x-3">
        <Button variant={tab==='products'?'default':'ghost'} onClick={()=>setTab('products')}>Products</Button>
        <Button variant={tab==='users'?'default':'ghost'} onClick={()=>setTab('users')}>Users</Button>
      </div>

      <div className="mt-4 bg-card rounded shadow p-3">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground text-left"><tr><th>Target</th><th>Reason</th><th>Reporter</th><th>Has transaction</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.filter(r=> (tab==='products'? r.targetType==='product' : r.targetType==='user')).map(r=> (
              <tr key={r.id} className="border-t"><td>{r.targetId}</td><td><span className="px-2 py-1 bg-gray-100 rounded text-xs">{r.reason}</span></td><td>{r.reporterId}</td><td>{r.hasExistingTransaction? 'Yes':'No'}</td><td>{r.status}</td><td><Button onClick={()=>view(r)}>View</Button></td></tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="text-sm text-muted-foreground">No reports</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-11/12 max-w-2xl p-4 bg-card rounded">
            <h4 className="font-semibold">Report detail</h4>
            <div className="mt-3 text-sm">Target: {selected.targetType} {selected.targetId}</div>
            <div className="mt-2 text-sm">Reason: {selected.reason}</div>
            <div className="mt-2 text-sm">Reporter: {selected.reporterId}</div>
            <div className="mt-2 text-sm">Has transaction: {selected.hasExistingTransaction ? 'Yes':'No'}</div>
            <div className="mt-2 text-sm">Description: {selected.description}</div>
            <div className="mt-4">
              <Button onClick={()=>mark('reviewed_valid')}>Mark as Valid</Button>
              <Button variant="destructive" className="ml-2" onClick={()=>mark('reviewed_invalid')}>Mark as Invalid</Button>
              <Button className="ml-2" onClick={()=>mark('spam')}>Mark as Spam</Button>
              <Button variant="ghost" className="ml-2" onClick={()=>setSelected(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
