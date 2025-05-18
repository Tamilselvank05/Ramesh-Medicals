export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      invoice_items: {
        Row: {
          discount: number | null
          id: string
          invoice_id: string
          medicine_id: string
          name: string
          quantity: number
          subtotal: number
          tax: number
          unit_price: number
        }
        Insert: {
          discount?: number | null
          id?: string
          invoice_id: string
          medicine_id: string
          name: string
          quantity?: number
          subtotal?: number
          tax?: number
          unit_price?: number
        }
        Update: {
          discount?: number | null
          id?: string
          invoice_id?: string
          medicine_id?: string
          name?: string
          quantity?: number
          subtotal?: number
          tax?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_received: number | null
          biller_id: string
          change_returned: number | null
          customer_name: string
          customer_phone: string | null
          date: string
          id: string
          invoice_number: string
          payment_method: string
          subtotal: number
          tax_total: number
          total: number
        }
        Insert: {
          amount_received?: number | null
          biller_id: string
          change_returned?: number | null
          customer_name: string
          customer_phone?: string | null
          date?: string
          id?: string
          invoice_number: string
          payment_method: string
          subtotal?: number
          tax_total?: number
          total?: number
        }
        Update: {
          amount_received?: number | null
          biller_id?: string
          change_returned?: number | null
          customer_name?: string
          customer_phone?: string | null
          date?: string
          id?: string
          invoice_number?: string
          payment_method?: string
          subtotal?: number
          tax_total?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          discount: number
          expiry_date: string
          id: string
          name: string
          prescription_required: boolean | null
          price: number
          stock: number
          tax: number
          vendor_id: string | null
        }
        Insert: {
          discount?: number
          expiry_date: string
          id?: string
          name: string
          prescription_required?: boolean | null
          price?: number
          stock?: number
          tax?: number
          vendor_id?: string | null
        }
        Update: {
          discount?: number
          expiry_date?: string
          id?: string
          name?: string
          prescription_required?: boolean | null
          price?: number
          stock?: number
          tax?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicines_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string | null
          id: string
          password: string
          phone: string | null
          role: string
          username: string
        }
        Insert: {
          email?: string | null
          id?: string
          password: string
          phone?: string | null
          role: string
          username: string
        }
        Update: {
          email?: string | null
          id?: string
          password?: string
          phone?: string | null
          role?: string
          username?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          email: string | null
          id: string
          name: string
          phone: string
          shop_address: string
        }
        Insert: {
          email?: string | null
          id?: string
          name: string
          phone: string
          shop_address: string
        }
        Update: {
          email?: string | null
          id?: string
          name?: string
          phone?: string
          shop_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
