/**
 * Hand-authored to match supabase/migrations/0001_init.sql.
 * Once the Supabase project exists, regenerate the authoritative version with:
 *   npx supabase gen types typescript --project-id <project-ref> > types/database.types.ts
 *
 * Every table includes `Relationships: []` — required by postgrest-js's
 * GenericTable shape even though we don't rely on its embedded-select type
 * inference (embedded selects like `category:categories(...)` are cast
 * manually with `as unknown as X` in lib/queries/*.ts).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PaymentMethod =
  | "UPI"
  | "Cash"
  | "Credit Card"
  | "Debit Card"
  | "Bank Transfer"
  | "Net Banking"
  | "Other";

export type RecurringFrequency = "weekly" | "monthly" | "yearly";
export type Theme = "light" | "dark" | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          currency: string;
          theme: Theme;
          date_format: string;
          monthly_budget_paise: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          icon: string | null;
          color: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount_paise: number;
          description: string;
          category_id: string | null;
          merchant: string | null;
          payment_method: PaymentMethod;
          expense_at: string;
          notes: string | null;
          recurring_expense_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["expenses"]["Row"]> & {
          user_id: string;
          amount_paise: number;
          description: string;
          payment_method: PaymentMethod;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Row"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          period_month: string;
          category_id: string | null;
          amount_paise: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["budgets"]["Row"]> & {
          user_id: string;
          period_month: string;
          amount_paise: number;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Row"]>;
        Relationships: [];
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string;
          amount_paise: number;
          description: string;
          category_id: string | null;
          merchant: string | null;
          payment_method: PaymentMethod;
          frequency: RecurringFrequency;
          interval_count: number;
          start_date: string;
          next_due_date: string;
          is_active: boolean;
          last_generated_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recurring_expenses"]["Row"]> & {
          user_id: string;
          amount_paise: number;
          description: string;
          payment_method: PaymentMethod;
          frequency: RecurringFrequency;
          start_date: string;
          next_due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_expenses"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_due_recurring_expenses: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_dashboard_stats: {
        Args: { ref_date?: string };
        Returns: {
          today_paise: number;
          week_paise: number;
          month_paise: number;
          previous_month_paise: number;
          month_transaction_count: number;
          avg_daily_paise: number;
          highest_expense_paise: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
