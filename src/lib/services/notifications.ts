/**
 * Notification Services
 * Last Updated: December 13, 2025
 */

import { supabase } from '../supabase'

export interface Notification {
  id: string
  user_id: string
  type: 'message' | 'transaction' | 'review' | 'warning' | 'suspension' | 'product_deleted' | 'reactivation' | 'admin' | 'announcement' | 'reward' | 'season_reset' | 'system' | 'report' | 'appeal'
  title: string
  message: string
  is_read: boolean
  related_id: string | null
  created_at: string
}

// Get user notifications
export async function getUserNotifications(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Notification[]
}

// Get notifications by filter
export async function getFilteredNotifications(
  userId: string, 
  filter: 'all' | 'unread' | 'messages' | 'system' | 'reports' | 'appeals',
  limit: number = 50
) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Apply filter
  if (filter === 'unread') {
    query = query.eq('is_read', false)
  } else if (filter === 'messages') {
    query = query.eq('type', 'message')
  } else if (filter === 'system') {
    query = query.in('type', ['system', 'announcement', 'admin'])
  } else if (filter === 'reports') {
    query = query.eq('type', 'report')
  } else if (filter === 'appeals') {
    query = query.eq('type', 'appeal')
  }

  const { data, error } = await query

  if (error) throw error
  return data as Notification[]
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string) {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return count || 0
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) throw error
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

// Create notification
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  relatedId?: string
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId || null
    })
    .select()
    .single()

  if (error) throw error
  return data as Notification
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
}

// Subscribe to user notifications with real-time updates
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: Notification) => void,
  onUpdateNotification?: (notification: Notification) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNewNotification(payload.new as Notification)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (onUpdateNotification) {
          onUpdateNotification(payload.new as Notification)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Notification templates
export const notificationTemplates = {
  newMessage: (senderName: string) => ({
    title: 'New Message',
    message: `${senderName} sent you a message`
  }),
  
  transactionRequest: (productTitle: string) => ({
    title: 'Transaction Request',
    message: `Someone wants to buy "${productTitle}"`
  }),
  
  transactionConfirmed: (productTitle: string) => ({
    title: 'Transaction Confirmed',
    message: `Your transaction for "${productTitle}" has been confirmed`
  }),
  
  newReview: (rating: number) => ({
    title: 'New Review',
    message: `You received a ${rating}-star review`
  }),
  
  creditScoreChange: (change: number, newScore: number) => ({
    title: 'Credit Score Update',
    message: `Your credit score ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)} points. New score: ${newScore}`
  }),
  
  iskoinEarned: (amount: number) => ({
    title: 'Iskoins Earned',
    message: `You earned ${amount} Iskoins!`
  }),
  
  rewardActivated: (rewardName: string) => ({
    title: 'Reward Activated',
    message: `Your "${rewardName}" reward is now active`
  }),
  
  seasonReset: (seasonName: string) => ({
    title: 'Season Reset',
    message: `${seasonName} has ended. Check your season summary!`
  }),
  
  warning: (reason: string) => ({
    title: 'Warning Received',
    message: `You received a warning: ${reason}`
  }),
  
  suspension: (duration: string) => ({
    title: 'Account Suspended',
    message: `Your account has been suspended for ${duration}`
  }),
  
  productDeleted: (productTitle: string, reason: string) => ({
    title: 'Product Deleted',
    message: `Your product \"${productTitle}\" was deleted. Reason: ${reason}`
  })
}

// Helper function for report status updates
export async function notifyReportUpdate(
  userId: string,
  status: string,
  reportId: string
) {
  let title = 'Report Update'
  let message = `Your report has been updated to: ${status}`
  
  if (status === 'resolved') {
    title = 'Report Resolved'
    message = 'Your report has been reviewed and resolved by our team.'
  } else if (status === 'dismissed') {
    title = 'Report Dismissed'
    message = 'Your report has been reviewed and dismissed.'
  }
  
  return createNotification(userId, 'admin', title, message, reportId)
}