import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Department {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface ProductGroup {
  id: string;
  name: string;
  code: string;
  department_id: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  product_group_id: string;
  purchase_price: number;
  sync_status: string;
  last_sync: string | null;
  created_at: string;
}

export interface ProductSupplier {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_price: number;
  freight_cost: number;
  is_primary: boolean;
  created_at: string;
}

export interface Contract {
  id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
  status: string;
  created_at: string;
}

export interface CustomerPriceGroup {
  id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
  description: string;
  status: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
  status: string;
  created_at: string;
}

export interface PricingRule {
  id: string;
  context_type: string;
  context_id: string;
  target_type: string;
  target_id: string;
  discount_type: string;
  discount_value: number;
  quantity_threshold: number;
  excluded: boolean;
  created_at: string;
}

export interface ProductWithDetails extends Product {
  product_group?: ProductGroup;
  department?: Department;
}
