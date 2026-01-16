import React from 'react'
import { Badge } from './ui/badge'

export function ForCausePreview({ data }: { data: any }) {
  return (
    <div className="p-4 bg-white/80 rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <Badge>💛 For a Cause</Badge>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{data.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Price</div>
          <div className="font-medium">₱{data.price}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Fundraising Goal</div>
          <div className="font-medium">₱{data.fundraisingGoal}</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded">
        <div className="text-sm font-semibold">Fundraising Details</div>
        <div className="text-sm mt-1">{data.fundraisingCause}</div>
        {data.organizationName ? <div className="text-sm text-muted-foreground mt-1">Organization: {data.organizationName}</div> : null}
        <div className="text-xs mt-2 text-muted-foreground">Proof of cause submitted and awaiting admin review.</div>
      </div>
    </div>
  )
}