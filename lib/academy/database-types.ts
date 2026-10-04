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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      academy_allocations: {
        Row: {
          active: boolean
          court_id: string
          ends_at: string
          id: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          court_id: string
          ends_at: string
          id?: string
          starts_at: string
        }
        Update: {
          active?: boolean
          court_id?: string
          ends_at?: string
          id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_allocations_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "academy_courts"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_attendance: {
        Row: {
          checked_in_at: string
          customer_id: string
          id: string
          membership_id: string
          visit_date: string
        }
        Insert: {
          checked_in_at?: string
          customer_id: string
          id?: string
          membership_id: string
          visit_date: string
        }
        Update: {
          checked_in_at?: string
          customer_id?: string
          id?: string
          membership_id?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_attendance_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_attendance_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "academy_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_blocks: {
        Row: {
          id: string
          reason: string
        }
        Insert: {
          id: string
          reason: string
        }
        Update: {
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_blocks_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "academy_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_bookings: {
        Row: {
          amount_paise: number
          created_at: string
          customer_id: string | null
          customer_name: string
          hold_expires_at: string | null
          id: string
          payment_status: string
          reason: string | null
          reference: string | null
          refunded_paise: number
          source: string
          status: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          hold_expires_at?: string | null
          id: string
          payment_status: string
          reason?: string | null
          reference?: string | null
          refunded_paise?: number
          source: string
          status: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          hold_expires_at?: string | null
          id?: string
          payment_status?: string
          reason?: string | null
          reference?: string | null
          refunded_paise?: number
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_bookings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "academy_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courts: {
        Row: {
          id: string
          name: string
          number: number
        }
        Insert: {
          id?: string
          name: string
          number: number
        }
        Update: {
          id?: string
          name?: string
          number?: number
        }
        Relationships: []
      }
      academy_customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      academy_memberships: {
        Row: {
          cancel_at_period_end: boolean
          cancellation_requested: boolean
          created_at: string
          current_period_start: string | null
          customer_id: string
          id: string
          last_reconciled_at: string | null
          paid_through: string | null
          provider_updated_at: number
          status: string
          subscription_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          cancellation_requested?: boolean
          created_at?: string
          current_period_start?: string | null
          customer_id: string
          id?: string
          last_reconciled_at?: string | null
          paid_through?: string | null
          provider_updated_at?: number
          status?: string
          subscription_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          cancellation_requested?: boolean
          created_at?: string
          current_period_start?: string | null
          customer_id?: string
          id?: string
          last_reconciled_at?: string | null
          paid_through?: string | null
          provider_updated_at?: number
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_notes: {
        Row: {
          actor_id: string
          body: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          actor_id: string
          body: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          actor_id?: string
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_notes_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_payment_attempts: {
        Row: {
          actor_id: string
          amount_paise: number
          booking_id: string | null
          created_at: string
          id: string
          last_reconciled_at: string | null
          membership_id: string | null
          provider_id: string | null
          status: string
        }
        Insert: {
          actor_id: string
          amount_paise: number
          booking_id?: string | null
          created_at?: string
          id?: string
          last_reconciled_at?: string | null
          membership_id?: string | null
          provider_id?: string | null
          status?: string
        }
        Update: {
          actor_id?: string
          amount_paise?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          last_reconciled_at?: string | null
          membership_id?: string | null
          provider_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_payment_attempts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_payment_attempts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "academy_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_payment_attempts_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "academy_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_payments: {
        Row: {
          amount_paise: number
          booking_id: string | null
          captured_at: string
          membership_id: string | null
          period_end: string | null
          period_start: string | null
          provider_order_id: string | null
          provider_payment_id: string
          refund_required: boolean
          refunded_paise: number
        }
        Insert: {
          amount_paise: number
          booking_id?: string | null
          captured_at: string
          membership_id?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_order_id?: string | null
          provider_payment_id: string
          refund_required?: boolean
          refunded_paise?: number
        }
        Update: {
          amount_paise?: number
          booking_id?: string | null
          captured_at?: string
          membership_id?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string
          refund_required?: boolean
          refunded_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "academy_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "academy_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_refunds: {
        Row: {
          amount_paise: number
          booking_id: string
          created_at: string
          id: string
          last_reconciled_at: string | null
          payment_id: string
          provider_refund_id: string | null
          reason: string
          status: string
        }
        Insert: {
          amount_paise: number
          booking_id: string
          created_at?: string
          id?: string
          last_reconciled_at?: string | null
          payment_id: string
          provider_refund_id?: string | null
          reason: string
          status?: string
        }
        Update: {
          amount_paise?: number
          booking_id?: string
          created_at?: string
          id?: string
          last_reconciled_at?: string | null
          payment_id?: string
          provider_refund_id?: string | null
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "academy_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "academy_payments"
            referencedColumns: ["provider_payment_id"]
          },
        ]
      }
      academy_requests: {
        Row: {
          action: string
          actor_id: string
          entity_id: string
          input: Json
          request_key: string
        }
        Insert: {
          action: string
          actor_id: string
          entity_id: string
          input: Json
          request_key: string
        }
        Update: {
          action?: string
          actor_id?: string
          entity_id?: string
          input?: Json
          request_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_requests_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "academy_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_webhook_events: {
        Row: {
          attempts: number
          body_hash: string
          created_at: string
          id: string
          lease_until: string
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          body_hash: string
          created_at?: string
          id: string
          lease_until?: string
          next_attempt_at?: string
          payload: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          body_hash?: string
          created_at?: string
          id?: string
          lease_until?: string
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      academy_booking_json: { Args: { p_id: string }; Returns: Json }
      academy_dispatch: {
        Args: { p_action: string; p_actor?: string; p_input?: Json }
        Returns: Json
      }
      academy_expire: { Args: never; Returns: undefined }
      academy_membership_json: { Args: { p_id: string }; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

// Convenient names used by the server-side repository.
export type DatabaseJson = Json;
export type AcademyDatabase = Database;
