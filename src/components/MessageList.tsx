import React, { useEffect, useRef } from 'react'
import type { Message, User } from '../lib/chat/types'

export default function MessageList({ messages, currentUser, otherUser, onSeen }: { messages: Message[]; currentUser: User; otherUser: User; onSeen?: () => void }) {
  const elRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = elRef.current
    if (el) el.scrollTop = el.scrollHeight
    if (onSeen) onSeen()
  }, [messages])

  return (
    <div ref={elRef} className="border rounded p-4 overflow-auto h-64 bg-white">
      {messages.map((m) => {
        const mine = m.senderId === currentUser.id
        const other = m.senderId === otherUser.id
        return (
          <div key={m.id} className={`mb-3 ${mine ? 'text-right' : 'text-left'}`}>
            <div style={{ display: 'inline-block', maxWidth: '80%' }}>
              <div style={{ padding: '8px', borderRadius: 6, background: m.isAutomated ? '#f3f4f6' : mine ? '#d1fae5' : '#eef2ff' }}>
                <div className="text-sm">{m.content}</div>
                <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
              {mine && (
                <div className="text-xs text-muted-foreground mt-1">{m.readByBuyer && m.readBySeller ? 'Seen' : 'Delivered'}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
