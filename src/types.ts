export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  eco_score: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  carbon_footprint: number;
  is_eco_certified: boolean;
  eco_rating: number;
  category: string;
  image_url: string;
  seller_id: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  total_carbon: number;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalCarbonSaved: number;
  salesByCategory: { category: string; total_sales: number }[];
  carbonByMonth: { month: string; carbon: number }[];
}
