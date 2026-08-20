export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string;
          created_at: string;
          id: string;
          label: string | null;
          user_id: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          user_id: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          action: string;
          admin_user_id: string | null;
          created_at: string;
          id: string;
          target: string | null;
        };
        Insert: {
          action: string;
          admin_user_id?: string | null;
          created_at?: string;
          id?: string;
          target?: string | null;
        };
        Update: {
          action?: string;
          admin_user_id?: string | null;
          created_at?: string;
          id?: string;
          target?: string | null;
        };
        Relationships: [];
      };
      job_items: {
        Row: {
          created_at: string;
          id: string;
          item_type: string;
          job_id: string;
          quantity: number;
          size: string;
          weight_lbs: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_type: string;
          job_id: string;
          quantity?: number;
          size?: string;
          weight_lbs?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_type?: string;
          job_id?: string;
          quantity?: number;
          size?: string;
          weight_lbs?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "job_items_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_photos: {
        Row: {
          created_at: string;
          id: string;
          job_id: string;
          phase: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          job_id: string;
          phase?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          job_id?: string;
          phase?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_status_history: {
        Row: {
          created_at: string;
          id: string;
          job_id: string;
          note: string | null;
          status: Database["public"]["Enums"]["job_status"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          job_id: string;
          note?: string | null;
          status: Database["public"]["Enums"]["job_status"];
        };
        Update: {
          created_at?: string;
          id?: string;
          job_id?: string;
          note?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
        };
        Relationships: [
          {
            foreignKeyName: "job_status_history_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          addons: Json;
          asap: boolean;
          created_at: string;
          customer_name: string;
          customer_phone: string | null;
          customer_price: number;
          customer_user_id: string | null;
          distance_miles: number;
          dropoff_access: string;
          dropoff_address: string;
          dropoff_flights: number;
          estimated_minutes: number;
          id: string;
          is_demo: boolean;
          mover_id: string | null;
          mover_payout: number;
          mover_user_id: string | null;
          parking_available: boolean;
          pickup_access: string;
          pickup_address: string;
          pickup_flights: number;
          platform_fee: number;
          price_breakdown: Json;
          reference: string;
          scheduled_for: string | null;
          service_level: string;
          special_instructions: string | null;
          status: Database["public"]["Enums"]["job_status"];
          updated_at: string;
          vehicle_type: Database["public"]["Enums"]["vehicle_type"];
        };
        Insert: {
          addons?: Json;
          asap?: boolean;
          created_at?: string;
          customer_name?: string;
          customer_phone?: string | null;
          customer_price?: number;
          customer_user_id?: string | null;
          distance_miles?: number;
          dropoff_access?: string;
          dropoff_address: string;
          dropoff_flights?: number;
          estimated_minutes?: number;
          id?: string;
          is_demo?: boolean;
          mover_id?: string | null;
          mover_payout?: number;
          mover_user_id?: string | null;
          parking_available?: boolean;
          pickup_access?: string;
          pickup_address: string;
          pickup_flights?: number;
          platform_fee?: number;
          price_breakdown?: Json;
          reference?: string;
          scheduled_for?: string | null;
          service_level?: string;
          special_instructions?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          updated_at?: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
        };
        Update: {
          addons?: Json;
          asap?: boolean;
          created_at?: string;
          customer_name?: string;
          customer_phone?: string | null;
          customer_price?: number;
          customer_user_id?: string | null;
          distance_miles?: number;
          dropoff_access?: string;
          dropoff_address?: string;
          dropoff_flights?: number;
          estimated_minutes?: number;
          id?: string;
          is_demo?: boolean;
          mover_id?: string | null;
          mover_payout?: number;
          mover_user_id?: string | null;
          parking_available?: boolean;
          pickup_access?: string;
          pickup_address?: string;
          pickup_flights?: number;
          platform_fee?: number;
          price_breakdown?: Json;
          reference?: string;
          scheduled_for?: string | null;
          service_level?: string;
          special_instructions?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          updated_at?: string;
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"];
        };
        Relationships: [
          {
            foreignKeyName: "jobs_mover_id_fkey";
            columns: ["mover_id"];
            isOneToOne: false;
            referencedRelation: "mover_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mover_documents: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          mover_id: string;
          url: string | null;
          verified: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          mover_id: string;
          url?: string | null;
          verified?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          mover_id?: string;
          url?: string | null;
          verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "mover_documents_mover_id_fkey";
            columns: ["mover_id"];
            isOneToOne: false;
            referencedRelation: "mover_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mover_profiles: {
        Row: {
          address: string | null;
          bio: string | null;
          business_name: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          insurance_policy: string | null;
          insurance_provider: string | null;
          is_demo: boolean;
          is_online: boolean;
          jobs_completed: number;
          license_number: string | null;
          license_state: string | null;
          phone: string | null;
          photo_url: string | null;
          profile_id: string | null;
          rating: number;
          service_area: string | null;
          status: Database["public"]["Enums"]["mover_status"];
          total_earnings: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          bio?: string | null;
          business_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          insurance_policy?: string | null;
          insurance_provider?: string | null;
          is_demo?: boolean;
          is_online?: boolean;
          jobs_completed?: number;
          license_number?: string | null;
          license_state?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          profile_id?: string | null;
          rating?: number;
          service_area?: string | null;
          status?: Database["public"]["Enums"]["mover_status"];
          total_earnings?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          bio?: string | null;
          business_name?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          insurance_policy?: string | null;
          insurance_provider?: string | null;
          is_demo?: boolean;
          is_online?: boolean;
          jobs_completed?: number;
          license_number?: string | null;
          license_state?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          profile_id?: string | null;
          rating?: number;
          service_area?: string | null;
          status?: Database["public"]["Enums"]["mover_status"];
          total_earnings?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mover_profiles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          customer_user_id: string | null;
          id: string;
          is_demo: boolean;
          job_id: string | null;
          mover_payout: number;
          platform_fee: number;
          provider: string;
          provider_payment_id: string | null;
          status: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          customer_user_id?: string | null;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          mover_payout?: number;
          platform_fee?: number;
          provider?: string;
          provider_payment_id?: string | null;
          status?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          customer_user_id?: string | null;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          mover_payout?: number;
          platform_fee?: number;
          provider?: string;
          provider_payment_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      payouts: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          is_demo: boolean;
          job_id: string | null;
          mover_id: string | null;
          status: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          mover_id?: string | null;
          status?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          mover_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payouts_mover_id_fkey";
            columns: ["mover_id"];
            isOneToOne: false;
            referencedRelation: "mover_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_rules: {
        Row: {
          key: string;
          label: string;
          unit: string;
          updated_at: string;
          value: number;
        };
        Insert: {
          key: string;
          label: string;
          unit?: string;
          updated_at?: string;
          value: number;
        };
        Update: {
          key?: string;
          label?: string;
          unit?: string;
          updated_at?: string;
          value?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_demo: boolean;
          phone: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_demo?: boolean;
          phone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_demo?: boolean;
          phone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          created_at: string;
          customer_user_id: string | null;
          id: string;
          is_demo: boolean;
          job_id: string | null;
          mover_id: string | null;
          review: string | null;
          stars: number;
        };
        Insert: {
          created_at?: string;
          customer_user_id?: string | null;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          mover_id?: string | null;
          review?: string | null;
          stars?: number;
        };
        Update: {
          created_at?: string;
          customer_user_id?: string | null;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          mover_id?: string | null;
          review?: string | null;
          stars?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_mover_id_fkey";
            columns: ["mover_id"];
            isOneToOne: false;
            referencedRelation: "mover_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          created_at: string;
          id: string;
          is_demo: boolean;
          job_id: string | null;
          message: string | null;
          status: string;
          subject: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          message?: string | null;
          status?: string;
          subject: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          job_id?: string | null;
          message?: string | null;
          status?: string;
          subject?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          created_at: string;
          id: string;
          is_demo: boolean;
          make: string | null;
          model: string | null;
          mover_id: string | null;
          photo_url: string | null;
          type: Database["public"]["Enums"]["vehicle_type"];
          year: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          make?: string | null;
          model?: string | null;
          mover_id?: string | null;
          photo_url?: string | null;
          type?: Database["public"]["Enums"]["vehicle_type"];
          year?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          make?: string | null;
          model?: string | null;
          mover_id?: string | null;
          photo_url?: string | null;
          type?: Database["public"]["Enums"]["vehicle_type"];
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_mover_id_fkey";
            columns: ["mover_id"];
            isOneToOne: false;
            referencedRelation: "mover_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "customer" | "mover" | "admin";
      job_status:
        | "REQUESTED"
        | "SEARCHING"
        | "MOVER_ASSIGNED"
        | "MOVER_EN_ROUTE"
        | "MOVER_ARRIVED"
        | "LOADING"
        | "IN_TRANSIT"
        | "ARRIVED"
        | "UNLOADING"
        | "COMPLETED"
        | "CANCELLED"
        | "DISPUTED";
      mover_status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
      vehicle_type: "PICKUP_TRUCK" | "CARGO_VAN" | "BOX_TRUCK";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "mover", "admin"],
      job_status: [
        "REQUESTED",
        "SEARCHING",
        "MOVER_ASSIGNED",
        "MOVER_EN_ROUTE",
        "MOVER_ARRIVED",
        "LOADING",
        "IN_TRANSIT",
        "ARRIVED",
        "UNLOADING",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
      ],
      mover_status: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"],
      vehicle_type: ["PICKUP_TRUCK", "CARGO_VAN", "BOX_TRUCK"],
    },
  },
} as const;
