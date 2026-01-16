import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type {
  ConversationMeta,
  Message,
  Appeal,
  User,
  ConversationFlags,
} from '../lib/chat/types'
import * as logic from '../lib/chat/logic'

// Simple in-memory store that mimics realtime updates
export type ConversationsState = {
  conversations: Record<string, ConversationMeta>
  messages: Record<string, Message[]>
  appeals: Record<string, Appeal>
  users: Record<string, User>
  typing: Record<string, Record<string, boolean>>
  // actions
  sendMessage: (conversationId: string, sender: User, content: string, isAutomated?: boolean) => Message
  markAsRead: (conversationId: string, viewerId: string) => void
  proposeMeetup: (conversationId: string, proposerId: string, isoDate: string) => void
  cancelMeetup: (conversationId: string) => void
  confirmMeetup: (conversationId: string, confirmerId: string) => void
  checkTimers: () => void
  startAppeal: (conversationId: string, userId: string, appeal: Appeal) => void
  adminApproveAppeal: (appealId: string) => void
  adminDismissAppeal: (appealId: string) => void
  markCompleted: (conversationId: string, userId: string) => void
  markDone: (conversationId: string) => void
  cancelDone: (conversationId: string) => void
  broadcastTyping: (conversationId: string, userId: string) => void
}

const defaultFlags: ConversationFlags = {
  isMarkedDone: false,
  responseRewardEnabled: true,
  transactionRewardsEnabled: true,
}

const ConversationContext = createContext<ConversationsState | null>(null)

export const useConversations = () => {
  const ctx = useContext(ConversationContext)
  if (!ctx) throw new Error('useConversations must be used inside Provider')
  return ctx
}

function makeId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Record<string, ConversationMeta>>({})
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [appeals, setAppeals] = useState<Record<string, Appeal>>({})
  const [typing, setTyping] = useState<Record<string, Record<string, boolean>>>({})
  const [users] = useState<Record<string, User>>({
    buyer1: { id: 'buyer1', role: 'buyer', name: 'Buyer One' },
    seller1: { id: 'seller1', role: 'seller', name: 'Seller One' },
    admin: { id: 'admin', role: 'seller', name: 'Admin' },
  })

  // Initialize a demo conversation
  useEffect(() => {
    const id = 'conv_demo_1'
    setConversations((prev) => ({
      ...prev,
      [id]: {
        id,
        buyerId: 'buyer1',
        sellerId: 'seller1',
        productId: 'product_1',
        flags: { ...defaultFlags },
        transaction: {
          meetupStatus: 'idle',
          buyerConfirmedMeetup: false,
          sellerConfirmedMeetup: false,
          buyerMarkedCompleted: false,
          sellerMarkedCompleted: false,
          buyerAppealed: false,
          sellerAppealed: false,
        },
        userAlreadyRated: false,
      },
    }))

    setMessages((prev) => ({ ...prev, [id]: [] }))
  }, [])

  const sendMessage = (conversationId: string, sender: User, content: string, isAutomated = false) => {
    const m: Message = {
      id: makeId('m_'),
      conversationId,
      senderId: sender.id,
      content,
      createdAt: new Date().toISOString(),
      readByBuyer: sender.role === 'buyer',
      readBySeller: sender.role === 'seller',
      isAutomated,
    }
    setMessages((prev) => {
      const list = prev[conversationId] ? [...prev[conversationId], m] : [m]
      return { ...prev, [conversationId]: list }
    })

    // Auto-welcome behaviour: only when buyer sends their first message of day
    const convo = conversations[conversationId]
    if (convo && !isAutomated) {
      const today = new Date().toDateString()
      const last = convo.lastAutoWelcomeAt ? new Date(convo.lastAutoWelcomeAt).toDateString() : null
      const isBuyerMessage = sender.role === 'buyer'
      const isFirstBuyerMsgToday = isBuyerMessage && !last && true // fallback
      // More robust: check if any existing messages today by buyer
      const msgs = messages[conversationId] || []
      const alreadySentToday = msgs.some((mm) => new Date(mm.createdAt).toDateString() === today && mm.senderId !== sender.id)

      const hasBuyerSentToday = msgs.some((mm) => mm.senderId === sender.id && new Date(mm.createdAt).toDateString() === today)

      const shouldSendAutoWelcome = sender.role === 'buyer' && !hasBuyerSentToday && (!convo.lastAutoWelcomeAt || new Date(convo.lastAutoWelcomeAt).toDateString() !== today)

      if (shouldSendAutoWelcome) {
        // auto message from the other user
        const otherId = sender.role === 'buyer' ? convo.sellerId : convo.buyerId
        const autoM = sendMessage(conversationId, users[otherId], "Hi! Thank you for messaging! I'll get back to you as soon as possible!", true)
        // update lastAutoWelcomeAt only once
        setConversations((prev) => ({ ...prev, [conversationId]: { ...prev[conversationId], lastAutoWelcomeAt: new Date().toISOString() } }))
        return m
      }
    }

    return m
  }

  const markAsRead = (conversationId: string, viewerId: string) => {
    setMessages((prev) => {
      const list = (prev[conversationId] || []).map((m) => {
        if (viewerId === conversations[conversationId].buyerId && m.senderId !== viewerId) return { ...m, readByBuyer: true }
        if (viewerId === conversations[conversationId].sellerId && m.senderId !== viewerId) return { ...m, readBySeller: true }
        return m
      })
      return { ...prev, [conversationId]: list }
    })
  }

  const proposeMeetup = (conversationId: string, proposerId: string, isoDate: string) => {
    setConversations((prev) => ({ ...prev, [conversationId]: logic.proposeMeetup(prev[conversationId], proposerId, isoDate) }))
  }

  const cancelMeetup = (conversationId: string) => {
    setConversations((prev) => ({ ...prev, [conversationId]: logic.cancelMeetup(prev[conversationId]) }))
  }

  const confirmMeetup = (conversationId: string, confirmerId: string) => {
    setConversations((prev) => ({ ...prev, [conversationId]: logic.confirmMeetup(prev[conversationId], confirmerId) }))
  }

  const markCompleted = (conversationId: string, userId: string) => {
    setConversations((prev) => ({ ...prev, [conversationId]: logic.markCompleted(prev[conversationId], userId) }))
  }

  const markDone = (conversationId: string) => {
    setConversations((prev) => ({ ...prev, [conversationId]: logic.markDone(prev[conversationId]) }))
  }

  const cancelDone = (conversationId: string) => {
    setConversations((prev) => ({ ...prev, [conversationId]: logic.cancelDone(prev[conversationId]) }))
  }

  const checkTimers = () => {
    // run expiration checks and window transitions
    setConversations((prev) => {
      const next: Record<string, ConversationMeta> = {}
      Object.keys(prev).forEach((k) => {
        let c = prev[k]
        c = logic.checkProposedExpired(c, new Date())
        c = logic.enterWindowToConfirm(c, new Date())

        // If window_to_confirm and deadline passed -> unsuccessful
        if (c.transaction.meetupStatus === 'window_to_confirm' && c.transaction.transactionConfirmDeadline) {
          if (new Date(c.transaction.transactionConfirmDeadline) < new Date()) {
            c = logic.markUnsuccessful(c, new Date())
          }
        }

        next[k] = c
      })
      return next
    })
  }

  useEffect(() => {
    const t = setInterval(() => checkTimers(), 2000)
    return () => clearInterval(t)
  }, [conversations, messages])

  const startAppeal = (conversationId: string, userId: string, appeal: Appeal) => {
    setAppeals((prev) => ({ ...prev, [appeal.id]: appeal }))
    setConversations((prev) => ({ ...prev, [conversationId]: logic.startAppeal(prev[conversationId], userId) }))
  }

  const adminApproveAppeal = (appealId: string) => {
    setAppeals((prev) => ({ ...prev, [appealId]: { ...prev[appealId], status: 'approved', reviewedAt: new Date().toISOString() } }))
    const appeal = appeals[appealId]
    if (appeal) {
      setConversations((prev) => ({ ...prev, [appeal.conversationId]: logic.approveAppeal(prev[appeal.conversationId], new Date()) }))
    }
  }

  const adminDismissAppeal = (appealId: string) => {
    setAppeals((prev) => ({ ...prev, [appealId]: { ...prev[appealId], status: 'dismissed', reviewedAt: new Date().toISOString() } }))
  }

  const broadcastTyping = (conversationId: string, userId: string) => {
    setTyping((prev) => ({ ...prev, [conversationId]: { ...(prev[conversationId] || {}), [userId]: true } }))
    setTimeout(() => {
      setTyping((prev) => ({ ...prev, [conversationId]: { ...(prev[conversationId] || {}), [userId]: false } }))
    }, 3000)
  }

  const value: ConversationsState = useMemo(() => ({
    conversations,
    messages,
    appeals,
    users,
    typing,
    sendMessage,
    markAsRead,
    proposeMeetup,
    cancelMeetup,
    confirmMeetup,
    checkTimers,
    startAppeal,
    adminApproveAppeal,
    adminDismissAppeal,
    markCompleted,
    markDone,
    cancelDone,
    broadcastTyping,
  }), [conversations, messages, appeals, typing])

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>
}
