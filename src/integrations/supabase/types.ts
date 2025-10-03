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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category_id: string
          created_at: string
          date_time: string | null
          duration_minutes: number
          end_time: string
          id: string
          notes: string | null
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          date_time?: string | null
          duration_minutes: number
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          date_time?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_streaks"
            referencedColumns: ["category_id"]
          },
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
        ]
      }
      categories: {
        Row: {
          boolean_goal_label: string | null
          color: string
          created_at: string
          daily_time_goal_minutes: number | null
          description: string | null
          goal_type: string
          id: string
          is_active: boolean
          is_boolean_goal: boolean
          level: number
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
          user_id: string
          weekly_time_goal_minutes: number | null
        }
        Insert: {
          boolean_goal_label?: string | null
          color?: string
          created_at?: string
          daily_time_goal_minutes?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          is_boolean_goal?: boolean
          level?: number
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
          weekly_time_goal_minutes?: number | null
        }
        Update: {
          boolean_goal_label?: string | null
          color?: string
          created_at?: string
          daily_time_goal_minutes?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          is_boolean_goal?: boolean
          level?: number
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
          weekly_time_goal_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "activity_streaks"
            referencedColumns: ["category_id"]
          },
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
        ]
      }
      daily_scores: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          overall_score: number
          score_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          overall_score: number
          score_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          overall_score?: number
          score_date?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          notes?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
          value?: number
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
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          target_unit: string | null
          target_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          target_unit?: string | null
          target_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          sleep_preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          sleep_preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          sleep_preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      activity_streaks: {
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
        Relationships: []
      }
      category_totals: {
        Row: {
          category_id: string | null
          category_name: string | null
          color: string | null
          daily_time_goal_minutes: number | null
          total_minutes_today: number | null
          total_minutes_week: number | null
          user_id: string | null
          weekly_time_goal_minutes: number | null
        }
        Relationships: []
      }
      goal_deficiencies: {
        Row: {
          category_id: string | null
          category_name: string | null
          color: string | null
          daily_deficiency: number | null
          deficiency_date: string | null
          is_daily_behind: boolean | null
          is_weekly_behind: boolean | null
          user_id: string | null
          weekly_deficiency: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cascade_delete_category: {
        Args: { category_id: string }
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
      seed_default_categories: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
