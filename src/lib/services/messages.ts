/**
 * Message and Chat Interaction Services
 * Last Updated: December 13, 2025
 * 
 * This file contains the Chat Interaction Logic Algorithm (3.13)
 * which governs how messages are processed, prioritized, and displayed
 * within IskoMarket's messaging system.
 */

// ==================== TYPE DEFINITIONS ====================

export interface Message {
  id: number;
  text?: string;
  sender: "me" | "them";
  timestamp: string;
  type?: "text" | "product";
  isRead?: boolean;
}

export interface ChatThread {
  id: string;
  contactId: number;
  contactName: string;
  contactAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isPriority: boolean;
  hasActiveTransaction: boolean;
  transactionStatus?: 'pending' | 'scheduled' | 'completed' | 'unsuccessful';
}

// ==================== CHAT THREAD ORGANIZATION ====================

/**
 * Chat Interaction Logic Algorithm (3.13)
 * 
 * Organizes chat threads using defined sorting rules:
 * - Priority 1: Unread messages
 * - Priority 2: Priority buyers (Top 5)
 * - Priority 3: Active transactions
 * - Priority 4: Most recent activity
 * 
 * @param threads - Array of chat threads to sort
 * @returns Sorted array of chat threads
 */
export function sortChatThreads(threads: ChatThread[]): ChatThread[] {
  return threads.sort((a, b) => {
    // Rule 1: Unread messages always come first
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    
    // Rule 2: Priority buyers (Top 5) get higher priority
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    
    // Rule 3: Active transactions get priority
    if (a.hasActiveTransaction && !b.hasActiveTransaction) return -1;
    if (!a.hasActiveTransaction && b.hasActiveTransaction) return 1;
    
    // Rule 4: Most recent messages first
    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
  });
}

// ==================== MESSAGE PROCESSING ====================

/**
 * Determine if auto-reply should be triggered
 * 
 * Auto-reply is triggered when:
 * - It's the first message in the conversation
 * - Message is from the buyer
 * - Seller has not yet responded
 * 
 * @param messageCount - Total number of messages in thread
 * @param isFirstFromBuyer - Whether this is the first message from buyer
 * @param hasSellerResponded - Whether seller has sent any message
 * @returns Boolean indicating if auto-reply should trigger
 */
export function shouldTriggerAutoReply(
  messageCount: number,
  isFirstFromBuyer: boolean,
  hasSellerResponded: boolean
): boolean {
  return messageCount === 1 && isFirstFromBuyer && !hasSellerResponded;
}

/**
 * Categorize message by read/unread status
 * 
 * @param message - Message object
 * @returns Message status category
 */
export function categorizeMessageByStatus(message: Message): 'unread' | 'read' {
  return message.isRead === false ? 'unread' : 'read';
}

/**
 * Categorize message by type
 * 
 * @param message - Message object
 * @returns Message type category
 */
export function categorizeMessageByType(message: Message): 'text' | 'product' | 'system' {
  if (message.type === 'product') return 'product';
  if (message.type === 'text') return 'text';
  return 'system';
}

// ==================== MESSAGE SORTING ====================

/**
 * Sort messages by timestamp in chronological order
 * 
 * @param messages - Array of messages
 * @returns Chronologically sorted messages
 */
export function sortMessagesByTime(messages: Message[]): Message[] {
  return messages.sort((a, b) => {
    const timeA = parseTimestamp(a.timestamp);
    const timeB = parseTimestamp(b.timestamp);
    return timeA - timeB;  // Chronological order (oldest first)
  });
}

/**
 * Parse timestamp string to milliseconds
 * 
 * @param timestamp - Timestamp string (e.g., "6:10 PM" or ISO string)
 * @returns Timestamp in milliseconds
 */
function parseTimestamp(timestamp: string): number {
  // If it's "Just now", return current time
  if (timestamp.toLowerCase() === 'just now') {
    return Date.now();
  }
  
  // Try to parse as Date
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }
  
  // If parsing fails, return 0 (will be sorted to the beginning)
  return 0;
}

// ==================== CHAT THREAD FILTERING ====================

/**
 * Filter chat threads by unread status
 * 
 * @param threads - Array of chat threads
 * @returns Only threads with unread messages
 */
export function filterUnreadThreads(threads: ChatThread[]): ChatThread[] {
  return threads.filter(thread => thread.unreadCount > 0);
}

/**
 * Filter chat threads by priority buyer status
 * 
 * @param threads - Array of chat threads
 * @returns Only threads with priority buyers
 */
export function filterPriorityThreads(threads: ChatThread[]): ChatThread[] {
  return threads.filter(thread => thread.isPriority);
}

/**
 * Filter chat threads with active transactions
 * 
 * @param threads - Array of chat threads
 * @returns Only threads with active transactions
 */
export function filterActiveTransactionThreads(threads: ChatThread[]): ChatThread[] {
  return threads.filter(thread => thread.hasActiveTransaction);
}

// ==================== MESSAGE STATISTICS ====================

/**
 * Calculate total unread message count across all threads
 * 
 * @param threads - Array of chat threads
 * @returns Total unread count
 */
export function getTotalUnreadCount(threads: ChatThread[]): number {
  return threads.reduce((total, thread) => total + thread.unreadCount, 0);
}

/**
 * Get most recent message timestamp from threads
 * 
 * @param threads - Array of chat threads
 * @returns Most recent message time or null
 */
export function getMostRecentMessageTime(threads: ChatThread[]): Date | null {
  if (threads.length === 0) return null;
  
  const sorted = sortChatThreads([...threads]);
  return sorted[0].lastMessageTime;
}

// ==================== AUTO-REPLY GENERATION ====================

/**
 * Generate standardized auto-reply message
 * 
 * @param messageId - ID for the new message
 * @param sellerId - ID of the seller sending auto-reply
 * @returns Auto-reply message object
 */
export function generateAutoReply(messageId: number, sellerId?: number): Message {
  return {
    id: messageId,
    text: "Hello! Thanks for your message. I'll get back to you as soon as possible.",
    sender: "them",
    timestamp: new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    type: "text",
    isRead: false,
  };
}

// ==================== MESSAGE VALIDATION ====================

/**
 * Validate if message is first from buyer
 * 
 * @param messages - All messages in thread
 * @param currentUserId - Current user's ID
 * @param buyerId - Buyer's ID
 * @returns Boolean indicating if this is first buyer message
 */
export function isFirstMessageFromBuyer(
  messages: Message[],
  currentUserId: number,
  buyerId: number
): boolean {
  // Filter messages from buyer
  const buyerMessages = messages.filter(msg => 
    msg.sender === 'me' && currentUserId === buyerId
  );
  
  return buyerMessages.length === 1;
}

/**
 * Check if seller has responded in thread
 * 
 * @param messages - All messages in thread
 * @param sellerId - Seller's ID
 * @returns Boolean indicating if seller has sent any message
 */
export function hasSellerResponded(
  messages: Message[],
  sellerId: number
): boolean {
  return messages.some(msg => msg.sender === 'them');
}

// ==================== EXPORTS ====================

export default {
  // Thread organization
  sortChatThreads,
  filterUnreadThreads,
  filterPriorityThreads,
  filterActiveTransactionThreads,
  
  // Message processing
  shouldTriggerAutoReply,
  categorizeMessageByStatus,
  categorizeMessageByType,
  sortMessagesByTime,
  
  // Statistics
  getTotalUnreadCount,
  getMostRecentMessageTime,
  
  // Auto-reply
  generateAutoReply,
  isFirstMessageFromBuyer,
  hasSellerResponded,
};
