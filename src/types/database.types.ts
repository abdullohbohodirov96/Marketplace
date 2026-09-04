/**
 * Hand-written subset of the Supabase database types, covering the tables
 * used by Stage 1 (auth, profile, store shell, feature flags).
 *
 * IMPORTANT: once the schema is pushed to a real Supabase project, replace
 * this file with the generated one:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
 *
 * Keep this file's shape (Database.public.Tables.<name>.{Row,Insert,Update})
 * so nothing importing from "@/types/database.types" needs to change.
 */

export type UserRole = "customer" | "seller" | "moderator" | "admin";
export type AccountStatus = "active" | "blocked" | "deletion_requested" | "deleted";
export type StoreStatus = "pending" | "approved" | "rejected" | "suspended";
export type StoreMemberRole = "owner" | "manager" | "staff";
export type ProductCondition = "new" | "used";
export type ProductStatus =
  | "draft"
  | "pending"
  | "active"
  | "hidden"
  | "out_of_stock"
  | "rejected"
  | "archived";
export type ModerationStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          phone_verified_at: string | null;
          email_verified_at: string | null;
          avatar_url: string | null;
          role: UserRole;
          locale: "uz" | "ru";
          status: AccountStatus;
          deletion_requested_at: string | null;
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      stores: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          banner_url: string | null;
          short_description: string | null;
          description: string | null;
          phone_primary: string;
          phones_extra: string[];
          telegram_url: string | null;
          instagram_url: string | null;
          website_url: string | null;
          market_name: string;
          block: string | null;
          row_label: string | null;
          shop_number: string | null;
          delivery_available: boolean;
          payment_methods: string[];
          installment_available: boolean;
          trade_in_available: boolean;
          warranty_terms: string | null;
          return_terms: string | null;
          status: StoreStatus;
          verified: boolean;
          rating_avg: number;
          rating_count: number;
          view_count: number;
          plan_code: "free" | "standard" | "pro";
          rejection_reason: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["stores"]["Row"]> & {
          owner_id: string;
          name: string;
          slug: string;
          phone_primary: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Row"]>;
      };
      store_members: {
        Row: {
          id: string;
          store_id: string;
          user_id: string;
          role: StoreMemberRole;
          invited_by: string | null;
          created_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["store_members"]["Row"]> & {
          store_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_members"]["Row"]>;
      };
      store_locations: {
        Row: {
          id: string;
          store_id: string;
          label: string;
          address_text: string | null;
          latitude: number;
          longitude: number;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["store_locations"]["Row"]> & {
          store_id: string;
          latitude: number;
          longitude: number;
        };
        Update: Partial<Database["public"]["Tables"]["store_locations"]["Row"]>;
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name_uz: string;
          name_ru: string | null;
          slug: string;
          icon: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          name_uz: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      catalog_products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category_id: string;
          brand_id: string | null;
          model: string | null;
          description: string | null;
          main_image_url: string | null;
          status: ModerationStatus;
          created_by: string | null;
          offer_count: number;
          min_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["catalog_products"]["Row"]> & {
          name: string;
          slug: string;
          category_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["catalog_products"]["Row"]>;
      };
      product_offers: {
        Row: {
          id: string;
          catalog_product_id: string;
          store_id: string;
          seller_product_name: string | null;
          slug: string;
          sku: string | null;
          barcode: string | null;
          price: number;
          old_price: number | null;
          currency: string;
          condition: ProductCondition;
          color: string | null;
          memory: string | null;
          short_description: string | null;
          description: string | null;
          tags: string[];
          stock_quantity: number;
          availability: boolean;
          warranty_months: number;
          delivery_available: boolean;
          installment_available: boolean;
          trade_in_available: boolean;
          view_count: number;
          favorite_count: number;
          last_confirmed_at: string;
          status: ProductStatus;
          rejection_reason: string | null;
          published_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["product_offers"]["Row"]> & {
          catalog_product_id: string;
          store_id: string;
          slug: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_offers"]["Row"]>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_offer_id: string;
          list_name: string;
          created_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["favorites"]["Row"]> & {
          user_id: string;
          product_offer_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Record<string, unknown>;
          dedupe_key: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      notification_preferences: {
        Row: {
          user_id: string;
          in_app_enabled: boolean;
          telegram_enabled: boolean;
          email_enabled: boolean;
          web_push_enabled: boolean;
          sms_enabled: boolean;
          muted_types: string[];
          quiet_hours_start: string;
          quiet_hours_end: string;
          timezone: string;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["notification_preferences"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Row"]>;
      };
      feature_flags: {
        Row: {
          key: string;
          label: string;
          is_enabled: boolean;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["feature_flags"]["Row"]> & { key: string };
        Update: Partial<Database["public"]["Tables"]["feature_flags"]["Row"]>;
      };
      plans: {
        Row: {
          code: "free" | "standard" | "pro";
          name_uz: string;
          name_ru: string | null;
          price_monthly: number;
          currency: string;
          max_products: number | null;
          max_images_per_product: number;
          max_branches: number;
          max_staff: number;
          top_results_included: boolean;
          verified_badge_included: boolean;
          ad_banners_included: boolean;
          analytics_level: "basic" | "advanced";
          sort_order: number;
          is_active: boolean;
        };
        Relationships: [];
        Insert: Partial<Database["public"]["Tables"]["plans"]["Row"]> & { code: string };
        Update: Partial<Database["public"]["Tables"]["plans"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_moderator_or_admin: { Args: Record<string, never>; Returns: boolean };
      current_role: { Args: Record<string, never>; Returns: UserRole };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      store_status: StoreStatus;
      store_member_role: StoreMemberRole;
      product_condition: ProductCondition;
      product_status: ProductStatus;
      moderation_status: ModerationStatus;
    };
  };
}
