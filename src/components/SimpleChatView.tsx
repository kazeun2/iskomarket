import React, { useState } from 'react'
import { useConversations } from '../contexts/ConversationContext'
import MessageList from './MessageList'
import MeetupPicker from './MeetupPicker'

export default function SimpleChatView({ conversationId, userId }: { conversationId: string; userId: string }) {
  const ctx = useConversations()
  const convo = ctx.conversations[conversationId]
  const msgs = ctx.messages[conversationId] || []
  const user = ctx.users[userId]
  const otherId = userId === convo.buyerId ? convo.sellerId : convo.buyerId
  const otherUser = ctx.users[otherId]

  const [input, setInput] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const hasMessages = msgs.length > 0
  const canChooseMeetup = hasMessages && !convo.flags.isMarkedDone && convo.transaction.meetupStatus !== 'unsuccessful'

  const send = () => {
    if (!input.trim()) return
    ctx.sendMessage(conversationId, user, input.trim())
    setInput('')
  }

  return (
    <div className="p-3 border rounded bg-card">
      <div className="mb-2 font-bold">{user.name} view</div>

      <div className="mb-2">
        <strong>Banner:</strong> {convo.transaction.meetupStatus}
      </div>

      <MessageList messages={msgs} currentUser={user} otherUser={otherUser} onSeen={() => ctx.markAsRead(conversationId, userId)} />

      <div className="mt-2 text-xs text-muted-foreground">
        {ctx.typing[conversationId] && ctx.typing[conversationId][otherId] ? `${otherUser.name || otherId} is typing...` : null}
      </div>

      <div className="mt-2 flex gap-2">
        <input className="flex-1" value={input} onChange={(e) => { setInput(e.target.value); ctx.broadcastTyping(conversationId, userId) }} placeholder="Type..." />
        <button className="btn btn-primary" onClick={send}>Send</button>
        <button className="btn" onClick={() => setShowPicker(true)} disabled={!canChooseMeetup}>Choose Meet‑up</button>
      </div>

      {showPicker && <div className="mt-2"><MeetupPicker onPick={(iso) => { ctx.proposeMeetup(conversationId, userId, iso); setShowPicker(false) }} onCancel={() => setShowPicker(false)} /></div>}

      <div className="mt-2 flex gap-2">
        <button className="btn" onClick={() => ctx.confirmMeetup(conversationId, userId)}>Confirm</button>
        <button className="btn" onClick={() => ctx.cancelMeetup(conversationId)}>Cancel</button>
        <button className="btn" onClick={() => ctx.markCompleted(conversationId, userId)}>Completed</button>
        <button className="btn" onClick={() => ctx.markDone(conversationId)}>Mark Done</button>
        <button className="btn" onClick={() => ctx.cancelDone(conversationId)}>Cancel Done</button>
      </div>
    </div>
  )
}
