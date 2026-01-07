/**
 * Category Services
 * Last Updated: December 13, 2025
 */

import { supabase } from '../supabase'

export interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

// Get all categories
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Category[]
}

// Get category by ID
export async function getCategory(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Category
}

// Get category by name
export async function getCategoryByName(name: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .single()

  if (error) throw error
  return data as Category
}