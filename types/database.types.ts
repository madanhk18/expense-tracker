/**
 * Hand-authored to match supabase/migrations/0001–0003.
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
export type CategoryType = "expense" | "income";
export type Theme = "light" | "dark" | "system";
export type InvestmentType =
  | "SIP"
  | "Mutual Fund"
  | "Stocks"
  | "FD"
  | "RD"
  | "Gold"
  | "PPF / EPF"
  | "NPS"
  | "Other";
export type LendingDirection = "lent" | "borrowed";
export type LendingStatus = "open" | "partially_settled" | "settled";

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
          type: CategoryType;
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
      income: {
        Row: {
          id: string;
          user_id: string;
          amount_paise: number;
          category_id: string | null;
          description: string | null;
          received_at: string;
          is_recurring: boolean;
          recurring_income_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["income"]["Row"]> & {
          user_id: string;
          amount_paise: number;
        };
        Update: Partial<Database["public"]["Tables"]["income"]["Row"]>;
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
      recurring_investments: {
        Row: {
          id: string;
          user_id: string;
          amount_paise: number;
          investment_type: InvestmentType;
          name: string;
          frequency: RecurringFrequency;
          interval_count: number;
          start_date: string;
          next_due_date: string;
          is_active: boolean;
          last_generated_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recurring_investments"]["Row"]> & {
          user_id: string;
          amount_paise: number;
          investment_type: InvestmentType;
          name: string;
          frequency: RecurringFrequency;
          start_date: string;
          next_due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_investments"]["Row"]>;
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          amount_paise: number;
          investment_type: InvestmentType;
          name: string;
          invested_at: string;
          invested_date: string;
          notes: string | null;
          recurring_investment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["investments"]["Row"]> & {
          user_id: string;
          amount_paise: number;
          investment_type: InvestmentType;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["investments"]["Row"]>;
        Relationships: [];
      };
      lending_records: {
        Row: {
          id: string;
          user_id: string;
          person_name: string;
          direction: LendingDirection;
          amount_paise: number;
          description: string | null;
          lent_at: string;
          due_date: string | null;
          status: LendingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lending_records"]["Row"]> & {
          user_id: string;
          person_name: string;
          direction: LendingDirection;
          amount_paise: number;
        };
        Update: Partial<Database["public"]["Tables"]["lending_records"]["Row"]>;
        Relationships: [];
      };
      lending_settlements: {
        Row: {
          id: string;
          user_id: string;
          lending_record_id: string;
          amount_paise: number;
          settled_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lending_settlements"]["Row"]> & {
          user_id: string;
          lending_record_id: string;
          amount_paise: number;
        };
        Update: Partial<Database["public"]["Tables"]["lending_settlements"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_due_recurring_expenses: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      generate_due_recurring_investments: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_money_flow: {
        Args: { ref_date?: string };
        Returns: {
          earned_paise: number;
          spent_paise: number;
          invested_paise: number;
          lent_paise: number;
          borrowed_paise: number;
          repaid_to_you_paise: number;
          repaid_by_you_paise: number;
        }[];
      };
      get_income_stats: {
        Args: { ref_date?: string };
        Returns: {
          today_income_paise: number;
          week_income_paise: number;
          month_income_paise: number;
          previous_month_income_paise: number;
          month_expense_paise: number;
          savings_rate_percent: number | null;
        }[];
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
