# Real-Time Chat System - Quick Reference

## 🚀 Quick Start for Developers

### Using the Chat System

#### 1. **Display Unread Badge:**
```tsx
import { useChat } from '../contexts/ChatContext';

export function NotificationBadge() {
  const { totalUnreadCount } = useChat();
  
  return (
    <div>
      {totalUnreadCount > 0 && (
        <span className="bg-red-500 text-white rounded-full px-2 py-1">
          {totalUnreadCount}
        </span>
      )}
    </div>
  );
}
```

#### 2. **List All Conversations:**
```tsx
import { useChat } from '../contexts/ChatContext';

export function ConversationsList() {
  const { conversations } = useChat();
  
  return (
    <div>
      {conversations.map((conv) => (
        <div key={conv.conversation_id}>
          <h3>{conv.other_user_id}</h3>
          <p>{conv.last_message}</p>
          {conv.unread_count > 0 && <span>Unread: {conv.unread_count}</span>}
        </div>
      ))}
    </div>
  );
}
```

#### 3. **Open Chat Modal:**
```tsx
import { ChatModal } from './ChatModal';
import { useState } from 'react';

export function ProductDetail({ product }) {
  const [showChat, setShowChat] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowChat(true)}>Message Seller</button>
      
      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        product={product}
        currentUser={currentUser}
        otherUser={sellerUser}
        recipient={sellerUser.id}
      />
    </>
  );
}
```

---

## 📊 Data Flow

```
User A Sends Message
    ↓
sendMessage() to Supabase
    ↓
Message inserted to DB
    ↓
Supabase Realtime broadcasts INSERT
    ↓
subscribeToConversationUpdates() fires
    ↓
ChatContext updates conversations
    ↓
Notification created automatically
    ↓
Components re-render with new data
    ↓
User B sees message instantly (no refresh)
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/services/messageService.ts` | Core message operations & subscriptions |
| `src/contexts/ChatContext.tsx` | Global chat state management |
| `src/components/ChatModal.tsx` | Chat UI & message display |
| `src/components/UserDashboard.tsx` | Conversation list display |
| `src/AppWithProviders.tsx` | Context provider setup |
| `src/lib/services/notifications.ts` | Notification creation & management |

---

## 🔌 API Reference

### messageService.ts

**`sendMessage(data)`**
```typescript
{
  sender_id: string;
  receiver_id: string;
  product_id?: string;
  message?: string;
}
→ { data: Message | null, error: any }
```

**`getMessages(params)`**
```typescript
{
  user_id: string;
  other_user_id: string;
  product_id?: string;
  limit?: number;
}
→ { data: Message[] | null, error: any }
```

**`subscribeToMessages(params, callback)`**
```typescript
params: {
  user_id: string;
  other_user_id: string;
  product_id?: string;
}
callback: (message: Message) => void
→ unsubscribe: () => void
```

**`getConversations(user_id)`**
```typescript
→ { data: Conversation[], error: any }
```

**`subscribeToConversationUpdates(user_id, callback)`**
```typescript
callback: (message: Message) => void
→ unsubscribe: () => void
```

### ChatContext

**`useChat()`**
```typescript
{
  conversations: Conversation[];
  totalUnreadCount: number;
  isLoading: boolean;
  refreshConversations: () => Promise<void>;
  markConversationAsRead: (conversation_id: string) => void;
}
```

---

## 🎨 UI Patterns

### Message Alignment
```
┌─────────────────────────────────────┐
│ LEFT (received)          RIGHT (sent) │
│ ┌──────────────┐      ┌──────────────┐
│ │ Hi! How are  │      │ I'm good!    │
│ │ you?         │      │ You?         │
│ └──────────────┘      └──────────────┘
└─────────────────────────────────────┘
```

### Product Card Alignment
```
Seller View:                Buyer View:
┌──────────────────────┐   ┌──────────────────────┐
│         RIGHT        │   │ LEFT                 │
│  ┌────────────────┐  │   │  ┌────────────────┐  │
│  │ My Product     │  │   │  │ Product        │  │
│  │ ₱1,200         │  │   │  │ ₱1,200         │  │
│  │ 📍 Gate 2      │  │   │  │ 📍 Gate 2      │  │
│  └────────────────┘  │   │  └────────────────┘  │
└──────────────────────┘   └──────────────────────┘
```

---

## ⚙️ Configuration

### Required Supabase Tables

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message_text TEXT,
  product_id INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

**conversations**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  product_id INTEGER,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
```

**notifications**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP DEFAULT now()
);
```

### Required RLS Policies

**messages - SELECT:**
```sql
CREATE POLICY "Users can read their messages"
ON messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
```

**messages - INSERT:**
```sql
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);
```

**conversations - SELECT:**
```sql
CREATE POLICY "Users can read their conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
```

---

## 🧪 Testing Code

```typescript
// Test sending message
async function testSendMessage() {
  const { data, error } = await sendMessage({
    sender_id: 'user-123',
    receiver_id: 'user-456',
    product_id: '1',
    message: 'Hello!'
  });
  
  if (error) console.error('Send failed:', error);
  else console.log('Message sent:', data);
}

// Test subscription
function testSubscription() {
  const unsubscribe = subscribeToMessages(
    { user_id: 'user-123', other_user_id: 'user-456' },
    (message) => {
      console.log('New message received:', message);
    }
  );
  
  // Unsubscribe after 5 minutes
  setTimeout(() => unsubscribe(), 5 * 60 * 1000);
}

// Test context
function TestComponent() {
  const { conversations, totalUnreadCount, refreshConversations } = useChat();
  
  return (
    <div>
      <p>Unread: {totalUnreadCount}</p>
      <p>Conversations: {conversations.length}</p>
      <button onClick={refreshConversations}>Refresh</button>
    </div>
  );
}
```

---

## 📱 Component Props

### ChatModal
```typescript
interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  otherUser?: any;
  recipient?: string;
  contactId?: number;
  isPriorityBuyer?: boolean;
  zIndex?: number;
  product?: {
    id: number;
    title: string;
    price: number;
    image?: string;
    seller_id?: string; // IMPORTANT for alignment
    // ... other props
  };
}
```

---

## 🎯 Common Tasks

### Mark All as Read
```typescript
const { conversations, markConversationAsRead } = useChat();

conversations.forEach(conv => {
  markConversationAsRead(conv.conversation_id);
});
```

### Get Unread Conversations
```typescript
const { conversations } = useChat();
const unreadConversations = conversations.filter(c => c.unread_count > 0);
```

### Sort by Latest Message
```typescript
const { conversations } = useChat();
const sorted = [...conversations].sort((a, b) => 
  new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
);
```

### Search Conversations
```typescript
const { conversations } = useChat();
function searchConversations(query: string) {
  return conversations.filter(c =>
    c.last_message.toLowerCase().includes(query.toLowerCase()) ||
    c.other_user_id.toLowerCase().includes(query.toLowerCase())
  );
}
```

---

## 🚨 Common Mistakes

❌ **Don't:**
- Use service role key on client
- Subscribe without unsubscribing
- Compare IDs without type coercion (`"123" !== 123`)
- Forget to update product.seller_id for alignment
- Create multiple ChatProviders

✅ **Do:**
- Use anon key for client-side
- Always return cleanup function from useEffect
- Type coerce IDs: `String(a) === String(b)`
- Ensure product data has seller_id
- Wrap app with single ChatProvider in AppWithProviders

---

## 📞 Support Resources

- Full guide: [REALTIME_CHAT_IMPLEMENTATION_GUIDE.md](./REALTIME_CHAT_IMPLEMENTATION_GUIDE.md)
- Troubleshooting: [CHAT_TROUBLESHOOTING_GUIDE.md](./CHAT_TROUBLESHOOTING_GUIDE.md)
- Supabase Docs: https://supabase.com/docs/guides/realtime
- React Context: https://react.dev/reference/react/useContext

---

Last Updated: December 18, 2025
