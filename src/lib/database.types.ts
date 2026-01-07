// =====================================================
// ISKOMARKET DATABASE TYPES
// Auto-generated TypeScript types for Supabase tables
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          
          program: string
          college: string
          
          bio: string | null
          avatar_url: string | null
          is_verified: boolean
          is_active: boolean
          is_suspended: boolean
          suspension_reason: string | null
          suspension_until: string | null
          is_admin: boolean
          iskoins: number
          locked_iskoins: number
          credit_score: number
          rank_tier: string
          total_purchases: number
          total_sales: number
          successful_transactions: number
          is_top_buyer: boolean
          is_top_seller: boolean
          is_trusted_member: boolean
          badges: Json
          current_season: number
          season_points: number
          season_rank: number | null
          last_spin_date: string | null
          spin_count: number
          total_spins: number
          glow_effect: string | null
          glow_expiry: string | null
          has_received_first_time_bonus: boolean
          last_100_credit_check_date: string | null
          days_at_100_credit: number
          last_active: string
          inactivity_warning_sent: boolean
          inactivity_warning_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          
          program: string
          college: string
          
          bio?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          is_suspended?: boolean
          suspension_reason?: string | null
          suspension_until?: string | null
          is_admin?: boolean
          iskoins?: number
          locked_iskoins?: number
          credit_score?: number
          rank_tier?: string
          total_purchases?: number
          total_sales?: number
          successful_transactions?: number
          is_top_buyer?: boolean
          is_top_seller?: boolean
          is_trusted_member?: boolean
          badges?: Json
          current_season?: number
          season_points?: number
          season_rank?: number | null
          last_spin_date?: string | null
          spin_count?: number
          total_spins?: number
          glow_effect?: string | null
          glow_expiry?: string | null
          has_received_first_time_bonus?: boolean
          last_100_credit_check_date?: string | null
          days_at_100_credit?: number
          last_active?: string
          inactivity_warning_sent?: boolean
          inactivity_warning_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          
          program?: string
          college?: string
          
          bio?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          is_suspended?: boolean
          suspension_reason?: string | null
          suspension_until?: string | null
          is_admin?: boolean
          iskoins?: number
          locked_iskoins?: number
          credit_score?: number
          rank_tier?: string
          total_purchases?: number
          total_sales?: number
          successful_transactions?: number
          is_top_buyer?: boolean
          is_top_seller?: boolean
          is_trusted_member?: boolean
          badges?: Json
          current_season?: number
          season_points?: number
          season_rank?: number | null
          last_spin_date?: string | null
          spin_count?: number
          total_spins?: number
          glow_effect?: string | null
          glow_expiry?: string | null
          has_received_first_time_bonus?: boolean
          last_100_credit_check_date?: string | null
          days_at_100_credit?: number
          last_active?: string
          inactivity_warning_sent?: boolean
          inactivity_warning_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          images: Json
          location: string | null
          meetup_locations: Json
          is_available: boolean
          is_sold: boolean
          is_hidden: boolean
          is_deleted: boolean
          deletion_reason: string | null
          is_for_cause: boolean
          cause_organization: string | null
          goal_amount: number | null
          raised_amount: number
          views: number
          interested: number
          created_at: string
          updated_at: string
          sold_at: string | null
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          images?: Json
          location?: string | null
          meetup_locations?: Json
          is_available?: boolean
          is_sold?: boolean
          is_hidden?: boolean
          is_deleted?: boolean
          deletion_reason?: string | null
          is_for_cause?: boolean
          cause_organization?: string | null
          goal_amount?: number | null
          raised_amount?: number
          views?: number
          interested?: number
          created_at?: string
          updated_at?: string
          sold_at?: string | null
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          description?: string
          price?: number
          category?: string
          condition?: string
          images?: Json
          location?: string | null
          meetup_locations?: Json
          is_available?: boolean
          is_sold?: boolean
          is_hidden?: boolean
          is_deleted?: boolean
          deletion_reason?: string | null
          is_for_cause?: boolean
          cause_organization?: string | null
          goal_amount?: number | null
          raised_amount?: number
          views?: number
          interested?: number
          created_at?: string
          updated_at?: string
          sold_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          product_id: string
          amount: number
          status: string
          meetup_location: string | null
          meetup_date: string | null
          meetup_confirmed_by_buyer: boolean
          meetup_confirmed_by_seller: boolean
          payment_method: string
          payment_status: string
          completed_at: string | null
          buyer_rating: number | null
          buyer_review: string | null
          seller_rating: number | null
          seller_review: string | null
          iskoins_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          product_id: string
          amount: number
          status?: string
          meetup_location?: string | null
          meetup_date?: string | null
          meetup_confirmed_by_buyer?: boolean
          meetup_confirmed_by_seller?: boolean
          payment_method?: string
          payment_status?: string
          completed_at?: string | null
          buyer_rating?: number | null
          buyer_review?: string | null
          seller_rating?: number | null
          seller_review?: string | null
          iskoins_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          product_id?: string
          amount?: number
          status?: string
          meetup_location?: string | null
          meetup_date?: string | null
          meetup_confirmed_by_buyer?: boolean
          meetup_confirmed_by_seller?: boolean
          payment_method?: string
          payment_status?: string
          completed_at?: string | null
          buyer_rating?: number | null
          buyer_review?: string | null
          seller_rating?: number | null
          seller_review?: string | null
          iskoins_earned?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          message: string
          product_id: string | null
          transaction_id: string | null
          is_read: boolean
          read_at: string | null
          is_automated: boolean
          automation_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          message: string
          product_id?: string | null
          transaction_id?: string | null
          is_read?: boolean
          read_at?: string | null
          is_automated?: boolean
          automation_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          message?: string
          product_id?: string | null
          transaction_id?: string | null
          is_read?: boolean
          read_at?: string | null
          is_automated?: boolean
          automation_type?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewed_user_id: string
          transaction_id: string | null
          product_id: string | null
          rating: number
          comment: string | null
          is_visible: boolean
          is_flagged: boolean
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewed_user_id: string
          transaction_id?: string | null
          product_id?: string | null
          rating: number
          comment?: string | null
          is_visible?: boolean
          is_flagged?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          reviewed_user_id?: string
          transaction_id?: string | null
          product_id?: string | null
          rating?: number
          comment?: string | null
          is_visible?: boolean
          is_flagged?: boolean
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_type: string
          reported_id: string
          reported_user_id: string | null
          reason: string
          description: string
          evidence_urls: Json
          status: string
          admin_notes: string | null
          resolved_by: string | null
          resolved_at: string | null
          action_taken: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_type: string
          reported_id: string
          reported_user_id?: string | null
          reason: string
          description: string
          evidence_urls?: Json
          status?: string
          admin_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          action_taken?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_type?: string
          reported_id?: string
          reported_user_id?: string | null
          reason?: string
          description?: string
          evidence_urls?: Json
          status?: string
          admin_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          action_taken?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          related_id: string | null
          related_type: string | null
          action_url: string | null
          is_read: boolean
          read_at: string | null
          priority: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          related_id?: string | null
          related_type?: string | null
          action_url?: string | null
          is_read?: boolean
          read_at?: string | null
          priority?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          related_id?: string | null
          related_type?: string | null
          action_url?: string | null
          is_read?: boolean
          read_at?: string | null
          priority?: string
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          message: string
          type: string
          target_audience: string
          target_colleges: Json
          is_active: boolean
          is_banner: boolean
          is_popup: boolean
          priority: number
          start_date: string
          end_date: string | null
          action_label: string | null
          action_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          message: string
          type?: string
          target_audience?: string
          target_colleges?: Json
          is_active?: boolean
          is_banner?: boolean
          is_popup?: boolean
          priority?: number
          start_date?: string
          end_date?: string | null
          action_label?: string | null
          action_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: string
          target_audience?: string
          target_colleges?: Json
          is_active?: boolean
          is_banner?: boolean
          is_popup?: boolean
          priority?: number
          start_date?: string
          end_date?: string | null
          action_label?: string | null
          action_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      announcement_views: {
        Row: {
          id: string
          announcement_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          user_id?: string
          viewed_at?: string
        }
      }
      seasons: {
        Row: {
          id: number
          season_number: number
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          season_number: number
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          season_number?: number
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      // season_leaderboard table removed from schema. Historical data should be retrieved from backups if needed.
      // REMOVED: season_leaderboard
      iskoin_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          description: string
          related_id: string | null
          related_type: string | null
          balance_before: number
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          description: string
          related_id?: string | null
          related_type?: string | null
          balance_before: number
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          description?: string
          related_id?: string | null
          related_type?: string | null
          balance_before?: number
          balance_after?: number
          created_at?: string
        }
      }
      daily_spins: {
        Row: {
          id: string
          user_id: string
          reward_type: string
          reward_amount: number
          reward_description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reward_type: string
          reward_amount?: number
          reward_description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reward_type?: string
          reward_amount?: number
          reward_description?: string | null
          created_at?: string
        }
      }
      credit_score_history: {
        Row: {
          id: string
          user_id: string
          change_amount: number
          reason: string
          score_before: number
          score_after: number
          related_id: string | null
          related_type: string | null
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          change_amount: number
          reason: string
          score_before: number
          score_after: number
          related_id?: string | null
          related_type?: string | null
          performed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          change_amount?: number
          reason?: string
          score_before?: number
          score_after?: number
          related_id?: string | null
          related_type?: string | null
          performed_by?: string | null
          created_at?: string
        }
      }
      moderation_logs: {
        Row: {
          id: string
          admin_id: string
          action_type: string
          target_type: string
          target_id: string
          reason: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: string
          target_type: string
          target_id: string
          reason: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: string
          target_type?: string
          target_id?: string
          reason?: string
          notes?: string | null
          created_at?: string
        }
      }
      /**
       * otp_verifications - DEPRECATED
       * This table was previously used for custom OTP flows. The project now prefers
       * Supabase Auth built-in OTP features (`signInWithOtp` / `verifyOtp`). The type
       * is kept here for backwards compatibility; consider removing the table from
       * your database if no longer needed.
       */
      otp_verifications: {
        Row: {
          id: string
          email: string
          otp_code: string
          is_used: boolean
          is_expired: boolean
          attempts: number
          expires_at: string
          purpose: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          otp_code: string
          is_used?: boolean
          is_expired?: boolean
          attempts?: number
          expires_at: string
          purpose: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          otp_code?: string
          is_used?: boolean
          is_expired?: boolean
          attempts?: number
          expires_at?: string
          purpose?: string
          created_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      active_products_view: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string
          price: number
          category: string
          condition: string
          images: Json
          location: string | null
          seller_username: string
          seller_name: string
          seller_avatar: string | null
          seller_credit_score: number
          seller_is_trusted: boolean
        }
      }
      user_stats_view: {
        Row: {
          id: string
          username: string
          credit_score: number
          iskoins: number
          total_purchases: number
          total_sales: number
          completed_transactions: number
          average_rating: number
          total_reviews: number
        }
      }
    }
    Functions: {
      calculate_credit_score: {
        Args: { user_uuid: string }
        Returns: number
      }
      clean_expired_otps: {
        Args: Record<string, never>
        Returns: void
      }
    }
  }
}