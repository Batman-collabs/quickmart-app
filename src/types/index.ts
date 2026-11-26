export type TabRoute = 'home' | 'categories' | 'search' | 'orders';

export interface Category {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  bgColor: string;
  accentColor: string;
  tagline: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  unit: string;
  price: number;
  mrp: number;
  emoji: string;
  cardBg: string;
  rating: number;
  deliveryMins: number;
  description: string;
  highlights: string[];
  isBestseller?: boolean;
  isFlashDeal?: boolean;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  line1: string;
  line2: string;
  etaMins: number;
}

export interface Coupon {
  code: string;
  title: string;
  description: string;
  minOrder: number;
  type: 'flat' | 'percent' | 'free_delivery';
  value: number;
  maxDiscount?: number;
}

export type OrderStage =
  | 'confirmed'
  | 'packing'
  | 'out_for_delivery'
  | 'arriving'
  | 'delivered';

export interface Order {
  id: string;
  items: CartItem[];
  itemTotal: number;
  deliveryFee: number;
  handlingFee: number;
  discount: number;
  grandTotal: number;
  totalSavings: number;
  address: Address;
  paymentMethod: string;
  createdAt: number;
  etaSecondsRemaining: number;
  stage: OrderStage;
  riderName: string;
  riderPhone: string;
}
