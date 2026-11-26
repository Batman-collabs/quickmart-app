export type TabRoute = 'home' | 'categories' | 'search' | 'orders' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logoEmoji: string;
  primaryColor: string;
  accentColor: string;
  deliveryEtaMins: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  handlingFee: number;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  supportPhone: string;
  supportEmail: string;
  storeAddress: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  totalSkus: number;
  lowStockCount: number;
  totalCustomers: number;
}

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
  imageUrl?: string;
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
  isActive?: boolean;
}

export type OrderStage =
  | 'confirmed'
  | 'packing'
  | 'out_for_delivery'
  | 'arriving'
  | 'delivered'
  | 'cancelled';

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
  paymentStatus?: string;
  createdAt: number;
  etaSecondsRemaining: number;
  stage: OrderStage;
  riderName: string;
  riderPhone: string;
}
