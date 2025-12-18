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
      bug_report_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          report_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          report_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_report_comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          created_at: string
          error_description: string
          error_path: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_description: string
          error_path: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_description?: string
          error_path?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_event_attendees: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          id: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attachments: Json | null
          attendees: Json | null
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_all_day: boolean
          location: string | null
          meeting_url: string | null
          order_id: string | null
          recurrence_end_date: string | null
          recurrence_rule: string | null
          reminders: Json | null
          start_time: string
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          attachments?: Json | null
          attendees?: Json | null
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          meeting_url?: string | null
          order_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          reminders?: Json | null
          start_time: string
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          attachments?: Json | null
          attendees?: Json | null
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          meeting_url?: string | null
          order_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          reminders?: Json | null
          start_time?: string
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          additional_price_per_person: number
          base_guest_count: number
          base_price: number
          cleaning_fee: number
          created_at: string
          created_by: string
          description: string | null
          field_labels: Json | null
          id: string
          image_urls: Json | null
          is_active: boolean
          name: string
          pricing_items: Json | null
          refund_policy: string
          terms_content: string
          updated_at: string
          vat_rate: number
        }
        Insert: {
          additional_price_per_person?: number
          base_guest_count?: number
          base_price?: number
          cleaning_fee?: number
          created_at?: string
          created_by: string
          description?: string | null
          field_labels?: Json | null
          id?: string
          image_urls?: Json | null
          is_active?: boolean
          name: string
          pricing_items?: Json | null
          refund_policy: string
          terms_content: string
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          additional_price_per_person?: number
          base_guest_count?: number
          base_price?: number
          cleaning_fee?: number
          created_at?: string
          created_by?: string
          description?: string | null
          field_labels?: Json | null
          id?: string
          image_urls?: Json | null
          is_active?: boolean
          name?: string
          pricing_items?: Json | null
          refund_policy?: string
          terms_content?: string
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          access_token: string
          additional_price: number
          agreed: boolean | null
          base_price: number
          business_address: string | null
          business_category: string | null
          business_name: string | null
          business_registration_number: string | null
          business_representative: string | null
          business_type: string | null
          cash_receipt_type: string | null
          checkin_time: string
          checkout_time: string
          cleaning_fee: number
          company_name: string | null
          created_at: string
          created_by: string
          customer_name: string | null
          guest_count: number
          id: string
          location: string
          personal_id_number: string | null
          personal_phone: string | null
          phone_number: string | null
          pricing_items: Json | null
          purpose: string | null
          receipt_email: string | null
          receipt_type: string | null
          refund_policy: string | null
          reservation_date: string
          signature_data: string | null
          submitted_at: string | null
          tax_invoice_requested: boolean | null
          template_id: string | null
          terms_content: string | null
          total_amount: number
          updated_at: string
          vat: number
          visit_source: string | null
        }
        Insert: {
          access_token?: string
          additional_price?: number
          agreed?: boolean | null
          base_price?: number
          business_address?: string | null
          business_category?: string | null
          business_name?: string | null
          business_registration_number?: string | null
          business_representative?: string | null
          business_type?: string | null
          cash_receipt_type?: string | null
          checkin_time: string
          checkout_time: string
          cleaning_fee?: number
          company_name?: string | null
          created_at?: string
          created_by: string
          customer_name?: string | null
          guest_count: number
          id?: string
          location: string
          personal_id_number?: string | null
          personal_phone?: string | null
          phone_number?: string | null
          pricing_items?: Json | null
          purpose?: string | null
          receipt_email?: string | null
          receipt_type?: string | null
          refund_policy?: string | null
          reservation_date: string
          signature_data?: string | null
          submitted_at?: string | null
          tax_invoice_requested?: boolean | null
          template_id?: string | null
          terms_content?: string | null
          total_amount?: number
          updated_at?: string
          vat?: number
          visit_source?: string | null
        }
        Update: {
          access_token?: string
          additional_price?: number
          agreed?: boolean | null
          base_price?: number
          business_address?: string | null
          business_category?: string | null
          business_name?: string | null
          business_registration_number?: string | null
          business_representative?: string | null
          business_type?: string | null
          cash_receipt_type?: string | null
          checkin_time?: string
          checkout_time?: string
          cleaning_fee?: number
          company_name?: string | null
          created_at?: string
          created_by?: string
          customer_name?: string | null
          guest_count?: number
          id?: string
          location?: string
          personal_id_number?: string | null
          personal_phone?: string | null
          phone_number?: string | null
          pricing_items?: Json | null
          purpose?: string | null
          receipt_email?: string | null
          receipt_type?: string | null
          refund_policy?: string | null
          reservation_date?: string
          signature_data?: string | null
          submitted_at?: string | null
          tax_invoice_requested?: boolean | null
          template_id?: string | null
          terms_content?: string | null
          total_amount?: number
          updated_at?: string
          vat?: number
          visit_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          receiver_id: string | null
          sender_email: string | null
          sender_id: string
          sender_name: string | null
          sender_role: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          receiver_id?: string | null
          sender_email?: string | null
          sender_id: string
          sender_name?: string | null
          sender_role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          receiver_id?: string | null
          sender_email?: string | null
          sender_id?: string
          sender_name?: string | null
          sender_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_order_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          order_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          order_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          order_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: string
          partner_id: string
          partner_memo: string | null
          service_date: string
          service_location: string
          service_type: string
          staff_id: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          partner_id: string
          partner_memo?: string | null
          service_date: string
          service_location: string
          service_type: string
          staff_id: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          partner_id?: string
          partner_memo?: string | null
          service_date?: string
          service_location?: string
          service_type?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rule_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          profile_id: string | null
          season_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          profile_id?: string | null
          season_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          profile_id?: string | null
          season_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rule_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rule_groups_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          base_guest_count: number | null
          condition: Json | null
          created_at: string
          end_time: string | null
          group_id: string
          id: string
          is_active: boolean
          is_percentage: boolean
          max_guests: number | null
          min_guests: number | null
          months: number[] | null
          name: string
          price: number
          price_per_additional_guest: number | null
          priority: number
          rule_type: string
          start_time: string | null
          updated_at: string
          weekdays: number[] | null
        }
        Insert: {
          base_guest_count?: number | null
          condition?: Json | null
          created_at?: string
          end_time?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          is_percentage?: boolean
          max_guests?: number | null
          min_guests?: number | null
          months?: number[] | null
          name: string
          price?: number
          price_per_additional_guest?: number | null
          priority?: number
          rule_type: string
          start_time?: string | null
          updated_at?: string
          weekdays?: number[] | null
        }
        Update: {
          base_guest_count?: number | null
          condition?: Json | null
          created_at?: string
          end_time?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          is_percentage?: boolean
          max_guests?: number | null
          min_guests?: number | null
          months?: number[] | null
          name?: string
          price?: number
          price_per_additional_guest?: number | null
          priority?: number
          rule_type?: string
          start_time?: string | null
          updated_at?: string
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pricing_rule_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_registration_number: string | null
          commission_rate: number | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          representative_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          service_regions: Json | null
          service_type: string | null
          slack_channel_id: string | null
          slack_user_id: string | null
          slack_webhook_url: string | null
          updated_at: string
        }
        Insert: {
          business_registration_number?: string | null
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          representative_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          service_regions?: Json | null
          service_type?: string | null
          slack_channel_id?: string | null
          slack_user_id?: string | null
          slack_webhook_url?: string | null
          updated_at?: string
        }
        Update: {
          business_registration_number?: string | null
          commission_rate?: number | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          representative_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          service_regions?: Json | null
          service_type?: string | null
          slack_channel_id?: string | null
          slack_user_id?: string | null
          slack_webhook_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          id: string
          order_id: string
          partner_id: string
          payment_date: string
          status: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          order_id: string
          partner_id: string
          payment_date: string
          status?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          id?: string
          order_id?: string
          partner_id?: string
          payment_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "STAFF" | "PARTNER"
      order_status:
        | "requested"
        | "accepted"
        | "confirmed"
        | "completed"
        | "settled"
        | "cancelled"
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
      app_role: ["STAFF", "PARTNER"],
      order_status: [
        "requested",
        "accepted",
        "confirmed",
        "completed",
        "settled",
        "cancelled",
      ],
    },
  },
} as const
