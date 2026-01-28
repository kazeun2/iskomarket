import React from 'react'
import { Badge } from './ui/badge'

export const ForCauseBadge = ({ status='pending', forSeller=false }: { status?: 'pending' | 'approved' | 'rejected'; forSeller?: boolean }) => {
  if (status === 'approved') return <Badge>💛 For a Cause – Admin reviewed</Badge>
  if (status === 'pending' && forSeller) return <Badge>For a Cause – Under review</Badge>
  return null
}
