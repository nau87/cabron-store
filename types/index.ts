export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[]; // Array de URLs de imágenes (hasta 3)
  stock: number;
  category: string;
  sku?: string; // Código SKU del producto
  size?: string;
  color?: string;
  material?: string;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  size?: string;
}

export interface Order {
  id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  created_at?: string;
}
