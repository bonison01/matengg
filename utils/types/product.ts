export type Product = {
    id: number;
    user_id?: string | null;
    name: string;
    description?: string | null;
    price_inr: number;
    media_urls: string[];
    category?: string | null;
    user_name?: string | null;
    discount_rate?: number | null;
    discounted_price?: number | null;
    quantity?: number | null;
    unit?: string | null;
    unit_quantity?: string | null;
    updated_at?: Date | null;
  };
  
  export type GroupedProducts = {
    [key: string]: Product[];
  };
  
