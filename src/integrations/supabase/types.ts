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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          active: boolean
          city: string
          created_at: string
          id: string
          minimum_order: number
          plz: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          city: string
          created_at?: string
          id?: string
          minimum_order?: number
          plz: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          city?: string
          created_at?: string
          id?: string
          minimum_order?: number
          plz?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          points_required: number
          reward_description: string | null
          reward_name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          points_required: number
          reward_description?: string | null
          reward_name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          points_required?: number
          reward_description?: string | null
          reward_name?: string
          sort_order?: number
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_total: number | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_total?: number | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_total?: number | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          available: boolean
          bestseller: boolean
          category: string
          created_at: string
          delivery_price: number | null
          description: string | null
          id: string
          image_url: string | null
          modifier_groups: Json
          name: string
          pickup_price: number | null
          popular: boolean
          price: number
          sort_order: number
          station: string
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          available?: boolean
          bestseller?: boolean
          category: string
          created_at?: string
          delivery_price?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          modifier_groups?: Json
          name: string
          pickup_price?: number | null
          popular?: boolean
          price: number
          sort_order?: number
          station?: string
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          available?: boolean
          bestseller?: boolean
          category?: string
          created_at?: string
          delivery_price?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          modifier_groups?: Json
          name?: string
          pickup_price?: number | null
          popular?: boolean
          price?: number
          sort_order?: number
          station?: string
          updated_at?: string
        }
        Relationships: []
      }
      opening_hours: {
        Row: {
          day_of_week: number
          id: string
          time_ranges: Json
          updated_at: string
        }
        Insert: {
          day_of_week: number
          id?: string
          time_ranges?: Json
          updated_at?: string
        }
        Update: {
          day_of_week?: number
          id?: string
          time_ranges?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pizza_pass: {
        Row: {
          free_pizzas_available: number
          id: string
          passes_completed: number
          pizza_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          free_pizzas_available?: number
          id?: string
          passes_completed?: number
          pizza_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          free_pizzas_available?: number
          id?: string
          passes_completed?: number
          pizza_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          points_balance: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          points_balance?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          points_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_pizzas_to_pass: {
        Args: { p_count: number; p_user_id: string }
        Returns: Json
      }
      award_points: {
        Args: { p_order_total: number; p_user_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      redeem_free_pizza: { Args: { p_user_id: string }; Returns: boolean }
      redeem_reward: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: boolean
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
