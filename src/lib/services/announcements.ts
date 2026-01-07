/**
 * Announcement Services
 * Last Updated: December 13, 2025
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

type AnnouncementRow = Database['public']['Tables']['announcements']['Row']
type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert']
type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update']

// Get active announcements
export async function getActiveAnnouncements(userCollege?: string) {
  const now = new Date().toISOString()
  
  let query = supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', now)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  // Filter by target audience
  let filteredData = data?.filter(announcement => {
    if (announcement.target_audience === 'all') return true
    if (userCollege && announcement.target_colleges) {
      const colleges = announcement.target_colleges as string[]
      return colleges.includes(userCollege)
    }
    return false
  })

  return filteredData as AnnouncementRow[]
}

// Get announcement by ID
export async function getAnnouncement(id: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as AnnouncementRow
}

// Create announcement (admin only)
export async function createAnnouncement(announcement: AnnouncementInsert) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
    .single()

  if (error) throw error
  return data as AnnouncementRow
}

// Update announcement (admin only)
export async function updateAnnouncement(id: string, updates: AnnouncementUpdate) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as AnnouncementRow
}

// Delete announcement (admin only)
export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Mark announcement as viewed by user
export async function markAnnouncementAsViewed(announcementId: string, userId: string) {
  const { error } = await supabase
    .from('announcement_views')
    .insert({
      announcement_id: announcementId,
      user_id: userId
    })

  if (error && error.code !== '23505') { // Ignore duplicate key error
    throw error
  }
}

// Check if user has viewed announcement
export async function hasUserViewedAnnouncement(announcementId: string, userId: string) {
  const { data, error } = await supabase
    .from('announcement_views')
    .select('id')
    .eq('announcement_id', announcementId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // Ignore "not found" error
    throw error
  }

  return !!data
}

// Get popup announcements for user
export async function getPopupAnnouncements(userId: string, userCollege?: string) {
  const announcements = await getActiveAnnouncements(userCollege)
  
  // Filter for popup announcements that user hasn't viewed
  const popupAnnouncements = []
  
  for (const announcement of announcements) {
    if (announcement.is_popup) {
      const viewed = await hasUserViewedAnnouncement(announcement.id, userId)
      if (!viewed) {
        popupAnnouncements.push(announcement)
      }
    }
  }

  return popupAnnouncements
}

// Get banner announcements
export async function getBannerAnnouncements(userCollege?: string) {
  const announcements = await getActiveAnnouncements(userCollege)
  return announcements.filter(a => a.is_banner)
}

// Get all announcements (admin only)
export async function getAllAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AnnouncementRow[]
}