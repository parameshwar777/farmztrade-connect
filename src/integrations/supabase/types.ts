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
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          note: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          note?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      animal_cart: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_cart_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "animal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_categories: {
        Row: {
          id: string
          image_url: string | null
          name: string
          name_te: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          name: string
          name_te?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
          name_te?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      animal_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "animal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_listings: {
        Row: {
          age_months: number | null
          breed: string | null
          category_slug: string
          city: string | null
          created_at: string
          description: string | null
          district: string | null
          gender: string | null
          health: string | null
          id: string
          is_popular: boolean
          latitude: number | null
          longitude: number | null
          milk_yield: number | null
          negotiable: boolean
          pincode: string | null
          pregnant: boolean | null
          price: number
          reject_reason: string | null
          seller_id: string
          state: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          vaccinated: boolean
          vaccination_note: string | null
          views: number
          village: string | null
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          breed?: string | null
          category_slug: string
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          gender?: string | null
          health?: string | null
          id?: string
          is_popular?: boolean
          latitude?: number | null
          longitude?: number | null
          milk_yield?: number | null
          negotiable?: boolean
          pincode?: string | null
          pregnant?: boolean | null
          price: number
          reject_reason?: string | null
          seller_id: string
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          vaccinated?: boolean
          vaccination_note?: string | null
          views?: number
          village?: string | null
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          breed?: string | null
          category_slug?: string
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          gender?: string | null
          health?: string | null
          id?: string
          is_popular?: boolean
          latitude?: number | null
          longitude?: number | null
          milk_yield?: number | null
          negotiable?: boolean
          pincode?: string | null
          pregnant?: boolean | null
          price?: number
          reject_reason?: string | null
          seller_id?: string
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          vaccinated?: boolean
          vaccination_note?: string | null
          views?: number
          village?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_listings_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "animal_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      animal_videos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "animal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string
          listing_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          listing_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "animal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "animal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_cart: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_categories: {
        Row: {
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      feed_order_items: {
        Row: {
          id: string
          image_url: string | null
          name: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          name: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          image_url?: string | null
          name?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "feed_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "feed_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "feed_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_orders: {
        Row: {
          address_line: string
          city: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          delivery_fee: number
          district: string | null
          id: string
          order_no: string
          payment_provider: string | null
          payment_ref: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pincode: string | null
          state: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          delivery_fee?: number
          district?: string | null
          id?: string
          order_no?: string
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          delivery_fee?: number
          district?: string | null
          id?: string
          order_no?: string
          payment_provider?: string | null
          payment_ref?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pincode?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_products: {
        Row: {
          active: boolean
          animal_type: string | null
          brand: string | null
          category_slug: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: string | null
          mrp: number | null
          name: string
          price: number
          rating: number
          stock: number
          suitable_for: string | null
          updated_at: string
          weight_label: string | null
        }
        Insert: {
          active?: boolean
          animal_type?: string | null
          brand?: string | null
          category_slug: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          mrp?: number | null
          name: string
          price: number
          rating?: number
          stock?: number
          suitable_for?: string | null
          updated_at?: string
          weight_label?: string | null
        }
        Update: {
          active?: boolean
          animal_type?: string | null
          brand?: string | null
          category_slug?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          mrp?: number | null
          name?: string
          price?: number
          rating?: number
          stock?: number
          suitable_for?: string | null
          updated_at?: string
          weight_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_products_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "feed_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      meetings: {
        Row: {
          conversation_id: string
          created_at: string
          created_by: string
          id: string
          meet_date: string
          meet_time: string | null
          note: string | null
          place: string | null
          status: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          created_by: string
          id?: string
          meet_date: string
          meet_time?: string | null
          note?: string | null
          place?: string | null
          status?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          created_by?: string
          id?: string
          meet_date?: string
          meet_time?: string | null
          note?: string | null
          place?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          kind: string
          payload: Json | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          payload?: Json | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          payload?: Json | null
          read_at?: string | null
          sender_id?: string
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          counter_amount: number | null
          created_at: string
          id: string
          listing_id: string
          message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "animal_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alt_contact: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          intent: Database["public"]["Enums"]["user_intent"]
          language: string
          phone: string | null
          pincode: string | null
          profile_complete: boolean
          rating: number
          state: string | null
          updated_at: string
          verification: Database["public"]["Enums"]["verification_status"]
          village: string | null
        }
        Insert: {
          alt_contact?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id: string
          intent?: Database["public"]["Enums"]["user_intent"]
          language?: string
          phone?: string | null
          pincode?: string | null
          profile_complete?: boolean
          rating?: number
          state?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
          village?: string | null
        }
        Update: {
          alt_contact?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          intent?: Database["public"]["Enums"]["user_intent"]
          language?: string
          phone?: string | null
          pincode?: string | null
          profile_complete?: boolean
          rating?: number
          state?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
          village?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          listing_id: string | null
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "animal_listings"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          address_doc_path: string | null
          admin_note: string | null
          created_at: string
          experience: string | null
          farm_details: string | null
          farm_name: string | null
          farm_photo_paths: string[]
          id: string
          id_doc_path: string | null
          id_doc_type: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address_doc_path?: string | null
          admin_note?: string | null
          created_at?: string
          experience?: string | null
          farm_details?: string | null
          farm_name?: string | null
          farm_photo_paths?: string[]
          id?: string
          id_doc_path?: string | null
          id_doc_type?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address_doc_path?: string | null
          admin_note?: string | null
          created_at?: string
          experience?: string | null
          farm_details?: string | null
          farm_name?: string | null
          farm_photo_paths?: string[]
          id?: string
          id_doc_path?: string | null
          id_doc_type?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "admin"
      listing_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "sold"
        | "suspended"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "countered"
        | "withdrawn"
        | "expired"
      order_status:
        | "payment_pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "success" | "failed" | "cancelled"
      user_intent: "buyer" | "seller" | "both"
      verification_status:
        | "unsubmitted"
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
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
    Enums: {
      app_role: ["user", "admin"],
      listing_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "sold",
        "suspended",
      ],
      offer_status: [
        "pending",
        "accepted",
        "rejected",
        "countered",
        "withdrawn",
        "expired",
      ],
      order_status: [
        "payment_pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "success", "failed", "cancelled"],
      user_intent: ["buyer", "seller", "both"],
      verification_status: [
        "unsubmitted",
        "pending",
        "approved",
        "rejected",
        "suspended",
      ],
    },
  },
} as const
