export interface StoreDetails {
    user_id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    is_business_owner: boolean;
    business_name: string;
    business_address: string;
    business_type: string;
    product_service: string;
    business_experience: string;
    business_description: string;
    is_registered: boolean;
    photo: string;
    categories: string[];      // If this is an array, change to: string[]
    rating: number;  // Adjust based on your schema
    whatsapp: string;
  }
  