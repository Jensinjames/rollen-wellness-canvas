export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category_id: string
          created_at: string | null
          date_time: string
          duration_minutes: number
          id: string
          is_completed: boolean | null
          name: string | null
          notes: string | null
          subcategory_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          date_time: string
          duration_minutes: number
          id?: string
          is_completed?: boolean | null
          name?: string | null
          notes?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          date_time?: string
          duration_minutes?: number
          id?: string
          is_completed?: boolean | null
          name?: string | null
          notes?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
          {
            foreignKeyName: "fk_activities_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_activities_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_activities_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
      categories: {
        Row: {
          boolean_goal_label: string | null
          color: string
          created_at: string | null
          daily_time_goal_minutes: number | null
          description: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          is_boolean_goal: boolean
          level: number
          name: string | null
          parent_id: string | null
          path: string[] | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
          weekly_time_goal_minutes: number | null
        }
        Insert: {
          boolean_goal_label?: string | null
          color?: string
          created_at?: string | null
          daily_time_goal_minutes?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          is_boolean_goal?: boolean
          level?: number
          name?: string | null
          parent_id?: string | null
          path?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
          weekly_time_goal_minutes?: number | null
        }
        Update: {
          boolean_goal_label?: string | null
          color?: string
          created_at?: string | null
          daily_time_goal_minutes?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          is_boolean_goal?: boolean
          level?: number
          name?: string | null
          parent_id?: string | null
          path?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_time_goal_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
      category_mappings: {
        Row: {
          category_id: string
          confidence_score: number | null
          created_at: string | null
          id: string
          subcategory_id: string | null
          text_input: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          subcategory_id?: string | null
          text_input: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          subcategory_id?: string | null
          text_input?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_category_mappings_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_category_mappings_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_category_mappings_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_category_mappings_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
          {
            foreignKeyName: "fk_category_mappings_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_category_mappings_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_category_mappings_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_category_mappings_subcategory"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
      daily_scores: {
        Row: {
          created_at: string
          daily_score_percentage: number | null
          health_balance_percentage: number | null
          id: string
          motivation_level_percentage: number | null
          score_date: string
          sleep_score_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_score_percentage?: number | null
          health_balance_percentage?: number | null
          id?: string
          motivation_level_percentage?: number | null
          score_date: string
          sleep_score_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_score_percentage?: number | null
          health_balance_percentage?: number | null
          id?: string
          motivation_level_percentage?: number | null
          score_date?: string
          sleep_score_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          actual_value: number | null
          completed: boolean | null
          created_at: string | null
          habit_id: string
          id: string
          log_date: string
          notes: string | null
          user_id: string
        }
        Insert: {
          actual_value?: number | null
          completed?: boolean | null
          created_at?: string | null
          habit_id: string
          id?: string
          log_date: string
          notes?: string | null
          user_id?: string
        }
        Update: {
          actual_value?: number | null
          completed?: boolean | null
          created_at?: string | null
          habit_id?: string
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string | null
          frequency_days: number[] | null
          frequency_type: Database["public"]["Enums"]["frequency_type"] | null
          id: string
          is_active: boolean | null
          name: string
          target_unit: string | null
          target_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          frequency_days?: number[] | null
          frequency_type?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          is_active?: boolean | null
          name: string
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          frequency_days?: number[] | null
          frequency_type?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "habits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "habits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string
          id: string
          preferences: Json | null
          sleep_preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          preferences?: Json | null
          sleep_preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          preferences?: Json | null
          sleep_preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rollups_daily: {
        Row: {
          activity_count: number | null
          category_id: string | null
          created_at: string | null
          date: string
          goal_minutes: number | null
          id: string
          subcategory_id: string | null
          total_minutes: number | null
          unaccounted_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_count?: number | null
          category_id?: string | null
          created_at?: string | null
          date: string
          goal_minutes?: number | null
          id?: string
          subcategory_id?: string | null
          total_minutes?: number | null
          unaccounted_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_count?: number | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          goal_minutes?: number | null
          id?: string
          subcategory_id?: string | null
          total_minutes?: number | null
          unaccounted_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rollups_daily_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rollups_daily_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "rollups_daily_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "rollups_daily_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
          {
            foreignKeyName: "rollups_daily_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rollups_daily_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "rollups_daily_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "rollups_daily_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sleep_entries: {
        Row: {
          bedtime: string | null
          created_at: string
          id: string
          notes: string | null
          sleep_date: string
          sleep_duration_minutes: number
          sleep_quality: number | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          sleep_date: string
          sleep_duration_minutes: number
          sleep_quality?: number | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          sleep_date?: string
          sleep_duration_minutes?: number
          sleep_quality?: number | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      category_totals: {
        Row: {
          activity_count: number | null
          activity_date: string | null
          category_id: string | null
          category_name: string | null
          color: string | null
          daily_progress_percentage: number | null
          daily_time_goal_minutes: number | null
          total_minutes: number | null
          user_id: string | null
          weekly_progress_percentage: number | null
          weekly_time_goal_minutes: number | null
        }
        Relationships: []
      }
      daily_streaks: {
        Row: {
          category_id: string | null
          category_name: string | null
          color: string | null
          streak_end: string | null
          streak_length: number | null
          streak_start: string | null
          total_streak_minutes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
      daily_unaccounted_time: {
        Row: {
          activity_count: number | null
          activity_date: string | null
          tracked_minutes: number | null
          unaccounted_minutes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      goal_deficiencies: {
        Row: {
          actual_minutes: number | null
          category_id: string | null
          category_name: string | null
          color: string | null
          daily_deficiency: number | null
          daily_time_goal_minutes: number | null
          deficiency_date: string | null
          is_daily_behind: boolean | null
          is_weekly_behind: boolean | null
          user_id: string | null
          weekly_deficiency: number | null
          weekly_time_goal_minutes: number | null
        }
        Relationships: []
      }
      subcategory_totals: {
        Row: {
          activity_count: number | null
          activity_date: string | null
          category_color: string | null
          category_id: string | null
          category_name: string | null
          subcategory_id: string | null
          subcategory_name: string | null
          total_minutes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_totals"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "goal_deficiencies"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subcategory_totals"
            referencedColumns: ["subcategory_id"]
          },
        ]
      }
    }
    Functions: {
      cascade_delete_category: {
        Args: { category_id_param: string; user_id_param: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          identifier: string
          max_requests?: number
          window_seconds?: number
        }
        Returns: Json
      }
      detect_suspicious_patterns: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_owner: {
        Args: { resource_user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          details?: Json
          event_type: string
          ip_address?: string
          user_agent?: string
          user_id?: string
        }
        Returns: undefined
      }
      secure_log_audit_event: {
        Args: {
          details_param?: Json
          event_type_param: string
          ip_address_param?: string
          user_agent_param?: string
          user_id_param?: string
        }
        Returns: undefined
      }
      seed_default_categories: {
        Args: { user_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      frequency_type: "daily" | "weekly" | "custom"
      preferred_activites: "preferences" | "habits"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      frequency_type: ["daily", "weekly", "custom"],
      preferred_activites: ["preferences", "habits"],
    },
  },
} as const
