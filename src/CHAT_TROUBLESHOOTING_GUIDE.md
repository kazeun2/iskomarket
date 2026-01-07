# Real-Time Chat Troubleshooting Guide

## 🔴 Common Issues & Solutions

### 1. Messages Not Appearing in Real-Time

**Symptom:** User sends message but it doesn't appear in other user's chat until page refresh

**Possible Causes & Solutions:**

1. **Supabase Realtime Not Enabled:**
   - Check Supabase dashboard → Project Settings → Realtime
   - Ensure `messages` table is enabled for realtime
   - Verify `conversations` table is enabled

2. **RLS Policies Blocking:**
   ```sql
   -- Check policies
   SELECT * FROM pg_policies WHERE tablename = 'messages';
   
   -- Verify user can SELECT messages
   SELECT COUNT(*) FROM messages 
   WHERE sender_id = 'YOUR_USER_ID' OR receiver_id = 'YOUR_USER_ID';
   ```

3. **Subscription Filter Issue:**
   - Check console for: `[MessageService]` logs
   - Verify `user_id` and `other_user_id` match database values
   - Ensure filter conditions are correct

4. **Network Issue:**
   - Check browser DevTools → Network tab
   - Look for Supabase realtime WebSocket connection
   - Should show `wss://...` connection

**Debug Steps:**
```typescript
// Add to ChatModal.tsx to verify subscription
useEffect(() => {
  console.log('Current user ID:', currentUserId);
  console.log('Recipient ID:', recipientId);
  console.log('Product ID:', product?.id);
}, [currentUserId, recipientId, product?.id]);
```

---

### 2. Duplicate Messages Appearing

**Symptom:** User sees same message twice (once from optimistic update, once from realtime)

**Causes:**

1. **Message not replaced properly:**
   - Check that optimistic message ID matches returned message ID
   - Verify `tempId` format matches database response

2. **Subscription receiving own messages:**
   - Filter should exclude `sender_id` when user is sender
   - Realtime filter might be too broad

**Solution:**
```typescript
// In subscribeToMessages callback
if (newMsg.receiver_id === params.user_id && newMsg.sender_id === params.other_user_id) {
  // Only trigger if from other user AND sent to current user
  onMessage(newMsg);
}
```

---

### 3. Unread Count Not Updating

**Symptom:** Badge shows 0 even when new messages received

**Possible Causes:**

1. **Conversation Realtime Not Working:**
   - Verify `subscribeToConversationUpdates()` is active
   - Check for errors in console

2. **Unread Count Not Incremented:**
   - Verify `unread_count` is correct in database
   - Check if messages marked as read prematurely

3. **ChatContext Not Provided:**
   - Ensure `ChatProvider` wraps entire app in `AppWithProviders.tsx`
   - Verify `useChat()` hook used correctly

**Debug:**
```typescript
// In ChatContext
console.log('New conversations:', updatedConversations);
console.log('Total unread:', updatedConversations.reduce((sum, c) => sum + c.unread_count, 0));
```

---

### 4. Product Card Not Aligning Correctly

**Symptom:** Product card appears on wrong side of chat

**Causes:**

1. **Seller ID Not Set:**
   ```sql
   -- Check if product.seller_id is NULL
   SELECT id, seller_id, title FROM products WHERE id = 'YOUR_PRODUCT_ID';
   ```

2. **Wrong Comparison:**
   - Check that `product.seller_id === currentUserId`
   - `currentUserId` might be string while `seller_id` is integer (or vice versa)

3. **Type Mismatch:**
   ```typescript
   // Add type coercion
   const isProductMine = product && 
     (String(product.seller_id) === String(currentUserId) || 
      (product.seller && String(product.seller.id) === String(currentUserId)));
   ```

**Debug:**
```typescript
console.log('Product seller_id:', product?.seller_id, typeof product?.seller_id);
console.log('Current user ID:', currentUserId, typeof currentUserId);
console.log('Match?', product?.seller_id === currentUserId);
```

---

### 5. Notifications Not Creating

**Symptom:** No notification appears when message received, toast shows but notification record not created

**Causes:**

1. **Notification Service Error:**
   - Check console for errors from `createNotification()`
   - Verify Supabase is configured

2. **User Not Authenticated:**
   - `user.id` might be undefined when notification created
   - Check `useAuth()` returns valid user

3. **RLS Policy Blocking:**
   - Service role might not have permission to create notifications
   - Verify `notifications` table RLS policy

**Solution:**
```typescript
// In ChatContext - add error handling
try {
  await createNotification(user.id, 'message', title, message, newMessage.id);
} catch (error) {
  console.error('Notification creation failed:', error);
  // Fallback to toast only
}
```

---

### 6. Messages Tab Not Updating

**Symptom:** Dashboard Messages tab shows old data even after new message sent

**Causes:**

1. **ChatContext Not Used:**
   - Dashboard using old mock data instead of context
   - `isExampleMode()` might always return true

2. **Conversation List Not Refreshing:**
   - `subscribeToConversationUpdates()` not subscribing
   - New conversations not appearing in list

3. **User Session Issue:**
   - ChatContext initialized before user authenticated
   - `user?.id` might be undefined

**Solution:**
```typescript
// Verify ChatContext in UserDashboard
const { conversations, totalUnreadCount } = useChat();
console.log('Using conversations from context:', conversations.length);

// Force refresh if needed
const { refreshConversations } = useChat();
useEffect(() => {
  refreshConversations();
}, []); // Refresh on mount
```

---

### 7. Messages Disappearing After Sending

**Symptom:** Message appears briefly then disappears

**Causes:**

1. **Message Not Saved to Database:**
   - `sendMessage()` returning error
   - Optimistic message removed but database insert failed

2. **Subscription Filter Removing Message:**
   - Filter condition too strict
   - Message replaced with undefined

**Debug:**
```typescript
// In ChatModal - log send result
const { data, error } = await sendMessage({...});
if (error) {
  console.error('Send failed:', error);
  console.log('Error details:', error.message, error.code);
}
if (data) {
  console.log('Message sent:', data);
}
```

---

### 8. Connection Drops or Reconnecting

**Symptom:** Messages not flowing, then suddenly catch up

**Causes:**

1. **WebSocket Disconnection:**
   - Check browser DevTools → Application → WebSocket
   - Look for connection loss/reconnection

2. **Channel Not Resubscribing:**
   - Cleanup function might not be removing channel properly
   - Multiple subscriptions accumulating

**Solution:**
```typescript
// Ensure proper cleanup
useEffect(() => {
  const unsubscribe = subscribeToMessages(...);
  
  return () => {
    console.log('Unsubscribing from messages');
    unsubscribe(); // Verify this is called
  };
}, [dependencies]);
```

---

## 🛠️ Diagnostic Commands

### Check Supabase Connection:
```typescript
import { supabase } from '../lib/supabase';

// In browser console
await supabase.auth.getUser();
// Should return authenticated user

// Check realtime connection
supabase.getChannels(); 
// Should show active channels
```

### Verify Message Subscription:
```typescript
// In browser console
supabase.getChannels()
  .filter(c => c.topic.includes('messages'))
  .forEach(c => console.log(c.topic, c.state));
```

### Check Database State:
```sql
-- Count conversations for user
SELECT COUNT(*) FROM conversations 
WHERE buyer_id = 'USER_ID' OR seller_id = 'USER_ID';

-- Check unread messages
SELECT COUNT(*) FROM messages 
WHERE receiver_id = 'USER_ID' AND is_read = false;
```

---

## 📋 Pre-Flight Checklist Before Deployment

- [ ] Supabase Realtime enabled for `messages` table
- [ ] Supabase Realtime enabled for `conversations` table  
- [ ] RLS policies verified for messages (SELECT, INSERT)
- [ ] RLS policies verified for conversations (SELECT)
- [ ] RLS policies verified for notifications (INSERT)
- [ ] ChatProvider wraps entire app
- [ ] `useChat()` hook available in components needing it
- [ ] Product table has `seller_id` populated for all products
- [ ] `getConversations()` correctly queries all fields
- [ ] Message field normalization handling all variants (`message`, `message_text`, `content`)
- [ ] Tested with 2+ user accounts simultaneously
- [ ] Tested notifications appearing in real-time
- [ ] Tested message alignment for sellers and buyers
- [ ] Tested product card alignment based on ownership
- [ ] Tested unread counts updating correctly
- [ ] Tested conversation list updates without refresh

---

## 💬 Quick Fixes

### Force Refresh Chat:
```typescript
import { useChat } from '../contexts/ChatContext';

const { refreshConversations } = useChat();

// In button handler
onClick={() => refreshConversations()}
```

### Manually Mark as Read:
```typescript
import { markAsRead } from '../services/messageService';

await markAsRead({
  user_id: currentUser.id,
  sender_id: otherUserId,
  product_id: productId
});
```

### Clear Local Cache:
```typescript
// In browser console
localStorage.clear();
location.reload();
```

---

## 🎯 Performance Tips

1. **Limit Message History:**
   - Only load last 50 messages initially
   - Load more on scroll

2. **Debounce Subscriptions:**
   - Don't subscribe to same conversation multiple times
   - Cleanup properly on unmount

3. **Optimize Unread Count:**
   - Calculate once per conversation update
   - Don't recalculate on every render

4. **Batch Notifications:**
   - Create one notification per incoming message, not multiple

---

For additional help, check the [REALTIME_CHAT_IMPLEMENTATION_GUIDE.md](./REALTIME_CHAT_IMPLEMENTATION_GUIDE.md)
