import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { formatRelativeTime } from '../utils/timeUtils'

type TxUser = {
  id?: string
  user_id?: string
  username?: string
  avatar_url?: string | null
}

export type TransactionWithJoins = {
  id: string
  status: string
  meetup_date?: string | null
  meetup_location?: string | null
  created_at: string
  product?: { id: string; title: string; images?: string[] }
  buyer?: TxUser
  seller?: TxUser
  sender_id?: string
  receiver_id?: string
}

type MessageCardProps = {
  transaction: TransactionWithJoins
  currentUserId: string
  onOpen: (tx: TransactionWithJoins) => void
}

export function MessageCard({ transaction, currentUserId, onOpen }: MessageCardProps) {
  // Determine other user
  const isCurrentReceiver = String(transaction.receiver_id) === String(currentUserId)
  const otherUser = isCurrentReceiver ? (transaction.buyer || {}) : (transaction.seller || {})
  const otherUserId = String(otherUser.user_id || otherUser.id || '')
  const username = otherUser.username || 'Unknown User'

  // Product title fallback
  const productTitle = transaction.product?.title || 'Product'

  // Meetup text
  let subtitle = 'Tap to view conversation'
  if (transaction.meetup_date) {
    try {
      const d = new Date(transaction.meetup_date)
      subtitle = `Meet-up: ${d.toLocaleDateString()} • ${transaction.meetup_location || 'TBD'}`
    } catch (e) {
      subtitle = transaction.meetup_location ? `Meet-up • ${transaction.meetup_location}` : 'Meet-up scheduled'
    }
  }

  const timeText = transaction.created_at ? formatRelativeTime(transaction.created_at) : 'Just now'

  return (
    <button
      onClick={() => onOpen(transaction)}
      className="flex w-full items-center gap-3 rounded-xl bg-white shadow-sm px-4 py-3 hover:bg-emerald-50 transition"
    >
      <div>
        <Avatar className="h-12 w-12">
          {otherUser.avatar_url ? (
            // @ts-ignore - AvatarImage accepts src prop
            <AvatarImage src={otherUser.avatar_url} alt={username} />
          ) : (
            <AvatarFallback className="bg-emerald-100 text-emerald-700">{username.split(' ').map(s => s[0]).join('').slice(0,2)}</AvatarFallback>
          )}
        </Avatar>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate">{username}</h3>
          <span className="text-sm text-muted-foreground flex-shrink-0">{timeText}</span>
        </div>
        <div className="mt-1">
          <div className="text-sm text-muted-foreground truncate">{productTitle}</div>
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        </div>
      </div>
    </button>
  )
}
