import { createTransaction, updateMeetupDetails, getPendingTransactions } from '../services/transactions'
import { sendMessage } from '../../services/messageService'
import { supabase } from '../supabase'

interface AgreeParams {
  productId: string
  buyerId: string
  sellerId: string
  meetupDate?: string | null
}

export async function agreeMeetupAndNotify({ productId, buyerId, sellerId, meetupDate }: AgreeParams) {
  if (!buyerId || !sellerId) throw new Error('Missing buyer or seller id')

  // Log payload for debugging (helps trace RLS/auth issues)
  const payload = { productId, buyerId, sellerId, meetupLocation, meetupDate }
  console.log('[agreeMeetupAndNotify] payload', payload)

  // Resolve authenticated user to ensure sender is authoritative
  let authUserId: string | null = null
  try {
    const { data: authData } = await supabase.auth.getUser()
    authUserId = authData?.user?.id || null
    console.log('[agreeMeetupAndNotify] auth user id:', authUserId)
    if (!authUserId) {
      console.warn('[agreeMeetupAndNotify] No authenticated user found - aborting')
      throw new Error('No authenticated Supabase user – cannot create transaction.')
    }
    // If caller provided a buyerId that differs from the session, prefer the session id
    if (buyerId && authUserId && buyerId !== authUserId) {
      console.warn('[agreeMeetupAndNotify] Provided buyerId does not match session user; overriding with session user', { provided: buyerId, sessionUser: authUserId })
      buyerId = authUserId
    }
  } catch (err) {
    console.warn('[agreeMeetupAndNotify] Failed to resolve auth session', err)
    throw err
  }

  // If transactions are temporarily disabled (e.g., during schema migrations or in test env),
  // create a local-only provisional transaction object and notify via chat without calling the server.
  const disableTransactions = process.env.NEXT_PUBLIC_DISABLE_TRANSACTIONS === '1' || (typeof window !== 'undefined' && (window as any).__ISKO_DISABLE_TRANSACTIONS === true)
  if (disableTransactions) {
    console.warn('[agreeMeetupAndNotify] Transactions disabled - creating provisional local transaction')
    const localTx: any = {
      id: `local-${Date.now()}`,
      product_id: String(productId),
      buyer_id: String(buyerId),
      receiver_id: String(sellerId),
      meetup_date: meetupDate || null,
      local_only: true,
    }
    try {
      const senderId = authUserId || String(buyerId)
      const dateLabel = meetupDate ? new Date(meetupDate).toLocaleString() : 'TBD'
      const messageText = `Meet-up proposed for ${dateLabel}`
      const { data: msgData, error: msgError } = await sendMessage({
        sender_id: String(senderId),
        receiver_id: String(sellerId),
        product_id: String(productId),
        message: messageText,
        automation_type: 'meetup_request',
        // Include meetup metadata so recipients can update UI even if transactions are local-only
        meetup_date: meetupDate || null,
        // don't include meetup_location; date-only prototype
        // don't include a transaction id that the server won't recognise
      })
      if (msgError) {
        console.error('[agreeMeetupAndNotify] Supabase message error (transactions disabled)', { message: msgError?.message, code: msgError?.code, details: msgError?.details })
        throw new Error(`Failed to send meetup notification: ${msgError?.message || 'unknown error'}`)
      }
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('iskomarket:transaction-created', { detail: localTx }))
        }
      } catch (e) {
        console.warn('[agreeMeetupAndNotify] Failed to dispatch transaction-created event for local tx', e)
      }
    } catch (e: any) {
      console.error('[agreeMeetupAndNotify] Failed to send meetup notification message (local tx)', { message: e?.message || e })
      throw e
    }
    return localTx
  }

  // Try to find an existing pending/confirmed transaction for this buyer/product
  let existingTx: any = null
  try {
    const pending = await getPendingTransactions(buyerId)
    // Use canonical column names `sender_id`/`receiver_id` when checking for existing tx
    existingTx = pending?.find((t: any) => String(t.product_id) === String(productId) && String(t.receiver_id) === String(sellerId))
  } catch (e: any) {
    console.error('[agreeMeetupAndNotify] Failed to fetch pending transactions', {
      message: e?.message || e,
      code: e?.code,
      details: e?.details || null,
    })
  }

  let tx: any
  if (existingTx) {
    try {
      // We do not use meetup locations in the date-only prototype; pass null for location
      tx = await updateMeetupDetails(existingTx.id, null, meetupDate || existingTx.meetup_date || null)
      console.log('[agreeMeetupAndNotify] updated transaction', { id: existingTx.id })
    } catch (e: any) {
      console.error('[agreeMeetupAndNotify] Failed to update meetup details', { message: e?.message, code: e?.code, details: e?.details })
      throw e
    }
  } else {
    try {
      tx = await createTransaction({ productId: String(productId), buyerId: String(buyerId), sellerId: String(sellerId), meetupLocation: null, meetupDate })
      console.log('[agreeMeetupAndNotify] created transaction', { id: tx?.id })
    } catch (e: any) {
      console.error('[agreeMeetupAndNotify] Failed to create transaction', { message: e?.message, code: e?.code, details: e?.details })
      throw e
    }
  }

  // Notify the other user via chat message so the change is visible immediately
  try {
    // Use session user as authoritative sender when sending chat notification
    const senderId = authUserId || String(buyerId)
    // Only include the date in the chat notification to avoid repeating seller-anchored locations
    const dateLabel = meetupDate ? new Date(meetupDate).toLocaleString() : 'TBD'
    const messageText = `Meet-up proposed for ${dateLabel}`
    const { data: msgData, error: msgError } = await sendMessage({
      sender_id: String(senderId),
      receiver_id: String(sellerId),
      product_id: String(productId),
      message: messageText,
      transaction_id: tx?.id ? String(tx.id) : undefined,
      automation_type: 'meetup_request',
      meetup_date: meetupDate || (tx?.meetup_date || null),
      meetup_location: meetupLocation || (tx?.meetup_location || null),
    })
    if (msgError) {
      console.error('[agreeMeetupAndNotify] Supabase message error', { message: msgError?.message, code: msgError?.code, details: msgError?.details })
      // Surface message failures to the caller so UI can show a visible error and revert optimistic state
      throw new Error(`Failed to send meetup notification: ${msgError?.message || 'unknown error'}`)
    } else {
      console.log('[agreeMeetupAndNotify] Sent meetup notification message', { messageId: msgData?.id, conversationId: (msgData as any)?.conversation_id })
    }
    try {
      if (typeof window !== 'undefined' && tx) {
        window.dispatchEvent(new CustomEvent('iskomarket:transaction-created', { detail: tx }));
      }
    } catch (e) {
      console.warn('[agreeMeetupAndNotify] Failed to dispatch transaction-created event', e);
    }
  } catch (e: any) {
    console.error('[agreeMeetupAndNotify] Failed to send meetup notification message', { message: e?.message || e, code: e?.code, details: e?.details })
  }

  return tx
}
