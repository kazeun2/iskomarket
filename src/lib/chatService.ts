import { supabase } from './supabase'

// Types
export type UserSummary = { id: string; username: string; avatar_url?: string | null }
export type ProductSummary = { id: string; title: string; price?: number }

export type ConversationSummary = {
  id: string
  otherUser: UserSummary
  product: ProductSummary
  lastMessage?: { body: string; created_at: string }
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

// 1) Try to find an existing conversation between the two users for the product
export async function getOrCreateConversation(currentUserId: string, otherUserId: string, productId: string) {
  // 1a) Try to find an existing conversation for this product where currentUser is a participant
  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select(
      `
        id,
        conversation_participants!inner(user_id),
        product:products(id, title, price),
        messages:messages(count)
      `
    )
    .eq('product_id', productId)
    .eq('conversation_participants.user_id', currentUserId)
    .limit(1)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing.id as string

  // 2) Create a new conversation (simple single insert)
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({ product_id: productId })
    .select('id')
    .single()

  if (convError) throw convError
  const conversationId = conv.id as string

  // 3) Add participants (best-effort)
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conversationId, user_id: currentUserId, role: 'buyer' },
      { conversation_id: conversationId, user_id: otherUserId, role: 'seller' },
    ])

  if (partError) throw partError

  return conversationId
}

// Helper: find an existing conversation between two users (any product)
export async function findConversationBetween(userA: string, userB: string) {
  // Strategy: find a conversation that has both participants
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .in('user_id', [userA, userB])

  if (error) throw error
  if (!data || data.length === 0) return null

  // Count occurrences of conversation_id across rows; pick one with both users
  const counts: Record<string, number> = {}
  for (const r of data) {
    const cid = (r as any).conversation_id
    counts[cid] = (counts[cid] || 0) + 1
  }

  const found = Object.keys(counts).find((k) => counts[k] >= 2)
  return found || null
}

// List conversations for dashboard
export async function listConversations(currentUserId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select(
      `
        conversation_id,
        conversation:conversations(
          id,
          product:products(id, title, price),
          participants:conversation_participants(
            user_id,
            user:users(id, username, avatar_url)
          ),
          last_message:messages(
            body,
            created_at
          )
        )
      `
    )
    .eq('user_id', currentUserId)

  if (error) throw error

  const result: ConversationSummary[] = []
  for (const row of data ?? []) {
    const conv = (row as any).conversation
    if (!conv) continue
    const other = (conv.participants ?? []).find((p: any) => p.user_id !== currentUserId)

    result.push({
      id: conv.id,
      otherUser: {
        id: other?.user?.id,
        username: other?.user?.username ?? 'Unknown User',
        avatar_url: other?.user?.avatar_url ?? null,
      },
      product: {
        id: conv.product?.id,
        title: conv.product?.title ?? 'Product',
        price: conv.product?.price ?? 0,
      },
      lastMessage: conv.last_message?.[0]
        ? { body: conv.last_message[0].body, created_at: conv.last_message[0].created_at }
        : undefined,
    })
  }

  return result
}

// List messages for a conversation
export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as Message[]
}

// Send message
export async function sendMessage(conversationId: string, senderId: string, rawText: string): Promise<Message> {
  const body = rawText?.trim()
  if (!body) throw new Error('Empty message')

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select('id, conversation_id, sender_id, body, created_at')
    .single()

  if (error) throw error
  return data as Message
}
