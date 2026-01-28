import React from 'react'
import { ConversationProvider } from '../contexts/ConversationContext'
import SimpleChatView from '../components/SimpleChatView'
import AdminAppeals from '../components/AdminAppeals'

export default function ChatPrototype() {
  const convId = 'conv_demo_1'
  return (
    <ConversationProvider>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 12, padding: 12 }}>
        <div>
          <SimpleChatView conversationId={convId} userId={'buyer1'} />
        </div>
        <div>
          <SimpleChatView conversationId={convId} userId={'seller1'} />
        </div>
        <div>
          <AdminAppeals />
        </div>
      </div>
    </ConversationProvider>
  )
}
