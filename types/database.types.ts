// Generado a partir del esquema de Supabase (proyecto sofia-ai-widgets-saas).
// No editar a mano: regenerar con generate_typescript_types tras cada migración.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_daily: {
        Row: {
          avg_response_time_ms: number
          conversations_count: number
          date: string
          errors_count: number
          id: string
          messages_received: number
          messages_sent: number
          tokens_input_total: number
          tokens_output_total: number
          unique_users: number
          widget_id: string
        }
        Insert: {
          avg_response_time_ms?: number
          conversations_count?: number
          date: string
          errors_count?: number
          id?: string
          messages_received?: number
          messages_sent?: number
          tokens_input_total?: number
          tokens_output_total?: number
          unique_users?: number
          widget_id: string
        }
        Update: {
          avg_response_time_ms?: number
          conversations_count?: number
          date?: string
          errors_count?: number
          id?: string
          messages_received?: number
          messages_sent?: number
          tokens_input_total?: number
          tokens_output_total?: number
          unique_users?: number
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ended_at: string | null
          feedback_text: string | null
          id: string
          outcome: string
          rating: number | null
          session_id: string
          started_at: string
          visitor_name: string | null
          widget_id: string
        }
        Insert: {
          ended_at?: string | null
          feedback_text?: string | null
          id?: string
          outcome?: string
          rating?: number | null
          session_id: string
          started_at?: string
          visitor_name?: string | null
          widget_id: string
        }
        Update: {
          ended_at?: string | null
          feedback_text?: string | null
          id?: string
          outcome?: string
          rating?: number | null
          session_id?: string
          started_at?: string
          visitor_name?: string | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          organization_id: string
          severity: string
          source: string
          widget_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          organization_id: string
          severity: string
          source: string
          widget_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          organization_id?: string
          severity?: string
          source?: string
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_execution_logs: {
        Row: {
          attempt_number: number
          conversation_id: string | null
          created_at: string
          duration_ms: number
          id: string
          integration_id: string
          request_payload: Json
          response_payload: Json | null
          result: string
          status_code: number | null
          widget_id: string | null
        }
        Insert: {
          attempt_number?: number
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number
          id?: string
          integration_id: string
          request_payload: Json
          response_payload?: Json | null
          result: string
          status_code?: number | null
          widget_id?: string | null
        }
        Update: {
          attempt_number?: number
          conversation_id?: string | null
          created_at?: string
          duration_ms?: number
          id?: string
          integration_id?: string
          request_payload?: Json
          response_payload?: Json | null
          result?: string
          status_code?: number | null
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_execution_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_execution_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "n8n_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_execution_logs_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          content_format: string
          conversation_id: string
          created_at: string
          id: string
          latency_ms: number | null
          role: string
          sequence_number: number
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          content: string
          content_format?: string
          conversation_id: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          role: string
          sequence_number: number
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          content?: string
          content_format?: string
          conversation_id?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          role?: string
          sequence_number?: number
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_integrations: {
        Row: {
          auth_credentials_encrypted: string | null
          auth_type: string
          created_at: string
          dynamic_variables: Json
          error_handling_strategy: string
          expected_response_format: Json
          headers: Json
          http_method: string
          id: string
          name: string
          organization_id: string
          retry_backoff_ms: number
          retry_count: number
          status: string
          timeout_ms: number
          updated_at: string
          webhook_url: string
        }
        Insert: {
          auth_credentials_encrypted?: string | null
          auth_type?: string
          created_at?: string
          dynamic_variables?: Json
          error_handling_strategy?: string
          expected_response_format?: Json
          headers?: Json
          http_method?: string
          id?: string
          name: string
          organization_id: string
          retry_backoff_ms?: number
          retry_count?: number
          status?: string
          timeout_ms?: number
          updated_at?: string
          webhook_url: string
        }
        Update: {
          auth_credentials_encrypted?: string | null
          auth_type?: string
          created_at?: string
          dynamic_variables?: Json
          error_handling_strategy?: string
          expected_response_format?: Json
          headers?: Json
          http_method?: string
          id?: string
          name?: string
          organization_id?: string
          retry_backoff_ms?: number
          retry_count?: number
          status?: string
          timeout_ms?: number
          updated_at?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role_id: string | null
          status: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          default_language: string
          id: string
          name: string
          owner_id: string
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_language?: string
          id?: string
          name: string
          owner_id: string
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_language?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_configs: {
        Row: {
          created_at: string
          credentials_encrypted: string
          default_max_tokens: number | null
          default_system_prompt: string | null
          default_temperature: number | null
          id: string
          last_validated_at: string | null
          model: string
          organization_id: string
          provider: string
          updated_at: string
          validation_status: string
        }
        Insert: {
          created_at?: string
          credentials_encrypted: string
          default_max_tokens?: number | null
          default_system_prompt?: string | null
          default_temperature?: number | null
          id?: string
          last_validated_at?: string | null
          model: string
          organization_id: string
          provider: string
          updated_at?: string
          validation_status?: string
        }
        Update: {
          created_at?: string
          credentials_encrypted?: string
          default_max_tokens?: number | null
          default_system_prompt?: string | null
          default_temperature?: number | null
          id?: string
          last_validated_at?: string | null
          model?: string
          organization_id?: string
          provider?: string
          updated_at?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_usage_logs: {
        Row: {
          conversation_id: string | null
          created_at: string
          error_type: string | null
          id: string
          input_tokens: number
          latency_ms: number
          output_tokens: number
          provider_config_id: string
          status: string
          updated_at: string
          widget_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          error_type?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number
          output_tokens?: number
          provider_config_id: string
          status: string
          updated_at?: string
          widget_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          error_type?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number
          output_tokens?: number
          provider_config_id?: string
          status?: string
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_usage_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_usage_logs_provider_config_id_fkey"
            columns: ["provider_config_id"]
            isOneToOne: false
            referencedRelation: "provider_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_usage_logs_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          is_system_role: boolean
          name: string
          organization_id: string | null
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system_role?: boolean
          name: string
          organization_id?: string | null
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system_role?: boolean
          name?: string
          organization_id?: string | null
          permissions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          domain: string
          id: string
          last_activity_at: string
          started_at: string
          status: string
          user_agent: string | null
          visitor_identifier: string
          visitor_name: string | null
          widget_id: string
        }
        Insert: {
          domain: string
          id?: string
          last_activity_at?: string
          started_at?: string
          status?: string
          user_agent?: string | null
          visitor_identifier: string
          visitor_name?: string | null
          widget_id: string
        }
        Update: {
          domain?: string
          id?: string
          last_activity_at?: string
          started_at?: string
          status?: string
          user_agent?: string | null
          visitor_identifier?: string
          visitor_name?: string | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      snippets: {
        Row: {
          generated_at: string
          id: string
          public_key: string
          revoked: boolean
          widget_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          public_key: string
          revoked?: boolean
          widget_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          public_key?: string
          revoked?: boolean
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "snippets_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      team_widgets: {
        Row: {
          created_at: string
          id: string
          team_id: string
          updated_at: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          updated_at?: string
          widget_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_widgets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_widgets_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          locale: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          locale?: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          locale?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      widget_appearance: {
        Row: {
          animations_enabled: boolean
          assistant_bubble_color: string
          assistant_text_color: string
          background_color: string
          border_radius: number
          company_name: string | null
          company_tagline: string | null
          created_at: string
          font_family: string
          footer_link_color: string
          footer_link_label: string | null
          footer_link_url: string | null
          header_subtitle: string | null
          header_title: string
          id: string
          initial_messages: Json
          launcher_color: string
          launcher_icon: string
          launcher_label: string | null
          launcher_shape: string
          launcher_type: string
          position: string
          primary_color: string
          shadow_style: string
          spacing_scale: string
          suggested_message_color: string
          suggested_messages: Json
          text_color: string
          theme_mode: string
          updated_at: string
          user_bubble_color: string
          widget_id: string
          window_height: number
          window_width: number
        }
        Insert: {
          animations_enabled?: boolean
          assistant_bubble_color?: string
          assistant_text_color?: string
          background_color?: string
          border_radius?: number
          company_name?: string | null
          company_tagline?: string | null
          created_at?: string
          font_family?: string
          footer_link_color?: string
          footer_link_label?: string | null
          footer_link_url?: string | null
          header_subtitle?: string | null
          header_title?: string
          id?: string
          initial_messages?: Json
          launcher_color?: string
          launcher_icon?: string
          launcher_label?: string | null
          launcher_shape?: string
          launcher_type?: string
          position?: string
          primary_color?: string
          shadow_style?: string
          spacing_scale?: string
          suggested_message_color?: string
          suggested_messages?: Json
          text_color?: string
          theme_mode?: string
          updated_at?: string
          user_bubble_color?: string
          widget_id: string
          window_height?: number
          window_width?: number
        }
        Update: {
          animations_enabled?: boolean
          assistant_bubble_color?: string
          assistant_text_color?: string
          background_color?: string
          border_radius?: number
          company_name?: string | null
          company_tagline?: string | null
          created_at?: string
          font_family?: string
          footer_link_color?: string
          footer_link_label?: string | null
          footer_link_url?: string | null
          header_subtitle?: string | null
          header_title?: string
          id?: string
          initial_messages?: Json
          launcher_color?: string
          launcher_icon?: string
          launcher_label?: string | null
          launcher_shape?: string
          launcher_type?: string
          position?: string
          primary_color?: string
          shadow_style?: string
          spacing_scale?: string
          suggested_message_color?: string
          suggested_messages?: Json
          text_color?: string
          theme_mode?: string
          updated_at?: string
          user_bubble_color?: string
          widget_id?: string
          window_height?: number
          window_width?: number
        }
        Relationships: [
          {
            foreignKeyName: "widget_appearance_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_wildcard: boolean
          updated_at: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_wildcard?: boolean
          updated_at?: string
          widget_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_wildcard?: boolean
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_domains_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_integrations: {
        Row: {
          created_at: string
          execution_order: number
          id: string
          integration_id: string
          trigger_point: string
          updated_at: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          execution_order?: number
          id?: string
          integration_id: string
          trigger_point?: string
          updated_at?: string
          widget_id: string
        }
        Update: {
          created_at?: string
          execution_order?: number
          id?: string
          integration_id?: string
          trigger_point?: string
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_integrations_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "n8n_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_integrations_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          out_of_schedule_behavior: string
          start_time: string
          timezone: string
          updated_at: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          out_of_schedule_behavior?: string
          start_time: string
          timezone?: string
          updated_at?: string
          widget_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          out_of_schedule_behavior?: string
          start_time?: string
          timezone?: string
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_schedules_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          inactivity_behavior: string
          language: string
          logo_url: string | null
          max_messages_per_session: number | null
          name: string
          organization_id: string
          persist_conversation_across_sessions: boolean
          provider_config_id: string | null
          status: string
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          inactivity_behavior?: string
          language?: string
          logo_url?: string | null
          max_messages_per_session?: number | null
          name: string
          organization_id: string
          persist_conversation_across_sessions?: boolean
          provider_config_id?: string | null
          status?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          inactivity_behavior?: string
          language?: string
          logo_url?: string | null
          max_messages_per_session?: number | null
          name?: string
          organization_id?: string
          persist_conversation_across_sessions?: boolean
          provider_config_id?: string | null
          status?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "widgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widgets_provider_config_id_fkey"
            columns: ["provider_config_id"]
            isOneToOne: false
            referencedRelation: "provider_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_organization_member_profiles: {
        Args: { p_organization_id: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
          locale: string
        }[]
      }
      is_organization_admin: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { p_organization_id: string }
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
