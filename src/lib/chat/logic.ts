import type {
  ConversationMeta,
  TransactionMeta,
  MeetupStatus,
  Appeal,
  Message,
} from './types'

function isoAddDays(dateIso: string | Date, days: number) {
  const d = typeof dateIso === 'string' ? new Date(dateIso) : new Date(dateIso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString()
}

export function computeTransactionConfirmDeadline(meetupDateIso: string) {
  // meetupDate + 7 days
  return isoAddDays(meetupDateIso, 7)
}

export function proposeMeetup(convo: ConversationMeta, proposerId: string, selectedIsoDate: string, now = new Date()): ConversationMeta {
  const txn: TransactionMeta = {
    ...convo.transaction,
    meetupStatus: 'proposed',
    meetupDate: selectedIsoDate,
    proposerId,
    buyerConfirmedMeetup: proposerId === convo.buyerId,
    sellerConfirmedMeetup: proposerId === convo.sellerId,
    meetupConfirmDeadline: isoAddDays(now, 3),
  }
  return { ...convo, transaction: txn }
}

export function cancelMeetup(convo: ConversationMeta): ConversationMeta {
  const txn: TransactionMeta = {
    ...convo.transaction,
    meetupStatus: 'idle',
    meetupDate: undefined,
    proposerId: undefined,
    buyerConfirmedMeetup: false,
    sellerConfirmedMeetup: false,
    meetupConfirmDeadline: undefined,
  }
  return { ...convo, transaction: txn }
}

export function confirmMeetup(convo: ConversationMeta, confirmerId: string): ConversationMeta {
  const txn = { ...convo.transaction }
  if (confirmerId === convo.buyerId) txn.buyerConfirmedMeetup = true
  if (confirmerId === convo.sellerId) txn.sellerConfirmedMeetup = true

  if (txn.buyerConfirmedMeetup && txn.sellerConfirmedMeetup) {
    txn.meetupStatus = 'confirmed'
    if (txn.meetupDate) txn.transactionConfirmDeadline = computeTransactionConfirmDeadline(txn.meetupDate)
  }

  return { ...convo, transaction: txn }
}

export function checkProposedExpired(convo: ConversationMeta, now = new Date()): ConversationMeta {
  const txn = { ...convo.transaction }
  if (txn.meetupStatus === 'proposed' && txn.meetupConfirmDeadline) {
    if (new Date(txn.meetupConfirmDeadline) < now) {
      txn.meetupStatus = 'idle'
      txn.meetupDate = undefined
      txn.proposerId = undefined
      txn.buyerConfirmedMeetup = false
      txn.sellerConfirmedMeetup = false
      txn.meetupConfirmDeadline = undefined
    }
  }
  return { ...convo, transaction: txn }
}

export function enterWindowToConfirm(convo: ConversationMeta, now = new Date()): ConversationMeta {
  const txn = { ...convo.transaction }
  if (txn.meetupStatus === 'confirmed' && txn.meetupDate) {
    const meetDate = new Date(txn.meetupDate)
    if (now >= meetDate && txn.transactionConfirmDeadline) {
      txn.meetupStatus = 'window_to_confirm'
    }
  }
  return { ...convo, transaction: txn }
}

export function markCompleted(convo: ConversationMeta, userId: string): ConversationMeta {
  const txn = { ...convo.transaction }
  if (userId === convo.buyerId) txn.buyerMarkedCompleted = true
  if (userId === convo.sellerId) txn.sellerMarkedCompleted = true

  if (txn.buyerMarkedCompleted && txn.sellerMarkedCompleted) {
    txn.meetupStatus = 'completed'
  }

  return { ...convo, transaction: txn }
}

export function markUnsuccessful(convo: ConversationMeta, now = new Date()): ConversationMeta {
  const txn = { ...convo.transaction }
  txn.meetupStatus = 'unsuccessful'
  txn.appealDeadline = isoAddDays(now, 7)
  return { ...convo, transaction: txn }
}

export function startAppeal(convo: ConversationMeta, userId: string, now = new Date()) {
  const txn = { ...convo.transaction }
  if (userId === convo.buyerId) txn.buyerAppealed = true
  if (userId === convo.sellerId) txn.sellerAppealed = true
  return { ...convo, transaction: txn }
}

export function approveAppeal(convo: ConversationMeta, now = new Date()): ConversationMeta {
  const txn = { ...convo.transaction }
  txn.meetupStatus = 'window_to_confirm'
  txn.buyerMarkedCompleted = false
  txn.sellerMarkedCompleted = false
  txn.transactionConfirmDeadline = isoAddDays(now, 7)
  txn.buyerAppealed = false
  txn.sellerAppealed = false
  txn.appealDeadline = undefined
  return { ...convo, transaction: txn }
}

export function dismissAppeal(convo: ConversationMeta): ConversationMeta {
  // keep unsuccessful
  return convo
}

export function markDone(convo: ConversationMeta): ConversationMeta {
  const flags = { ...convo.flags }
  flags.isMarkedDone = true
  flags.responseRewardEnabled = false
  flags.transactionRewardsEnabled = false
  const txn = { ...convo.transaction }
  txn.meetupStatus = 'done_marked'
  return { ...convo, flags, transaction: txn }
}

export function cancelDone(convo: ConversationMeta): ConversationMeta {
  const flags = { ...convo.flags }
  flags.isMarkedDone = false
  flags.responseRewardEnabled = true
  flags.transactionRewardsEnabled = true
  const txn = { ...convo.transaction }
  if (txn.meetupStatus === 'done_marked') txn.meetupStatus = 'idle'
  return { ...convo, flags, transaction: txn }
}

export function canOpenRateUser(transaction: TransactionMeta, userAlreadyRated: boolean) {
  return transaction.meetupStatus === 'completed' && !userAlreadyRated
}

// Simple placeholder: check inappropriate messages (returns list of message ids)
export function checkInappropriateMessages(messages: Message[]) {
  return messages.filter((m) => /inappropriate/i.test(m.content)).map((m) => m.id)
}

export function computeDaysUntil(isoDate?: string) {
  if (!isoDate) return null
  const d = new Date(isoDate)
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}
