export type UserRole = 'buyer' | 'seller'

export type MeetupStatus =
  | 'idle'
  | 'proposed'
  | 'confirmed'
  | 'window_to_confirm'
  | 'completed'
  | 'unsuccessful'
  | 'done_marked'

export type ConversationFlags = {
  isMarkedDone: boolean
  responseRewardEnabled: boolean
  transactionRewardsEnabled: boolean
}

export type TransactionMeta = {
  transactionId?: string
  meetupStatus: MeetupStatus
  meetupDate?: string // ISO
  proposerId?: string
  buyerConfirmedMeetup: boolean
  sellerConfirmedMeetup: boolean
  meetupConfirmDeadline?: string
  transactionConfirmDeadline?: string

  buyerMarkedCompleted: boolean
  sellerMarkedCompleted: boolean

  buyerAppealed: boolean
  sellerAppealed: boolean
  appealDeadline?: string
}

export type ConversationMeta = {
  id: string
  buyerId: string
  sellerId: string
  productId: string

  flags: ConversationFlags
  transaction: TransactionMeta

  lastAutoWelcomeAt?: string
  userAlreadyRated: boolean
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readByBuyer: boolean
  readBySeller: boolean
  isAutomated?: boolean
}

export type AppealReason =
  | 'forgot_to_click'
  | 'met_but_issue'
  | 'technical_issue'
  | 'other'

export type Appeal = {
  id: string
  transactionId: string
  conversationId: string
  productId: string
  buyerId: string
  sellerId: string
  submittedById: string
  reason: AppealReason
  description?: string
  evidenceUrl?: string
  status: 'pending' | 'approved' | 'dismissed'
  createdAt: string
  reviewedAt?: string
}

export type User = {
  id: string
  role: UserRole
  name?: string
}
