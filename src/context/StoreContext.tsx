import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { COUPONS, DEFAULT_ADDRESSES, PRODUCTS } from '../data/catalog';
import { Address, CartItem, Coupon, Order, OrderStage, Product } from '../types';

interface StoreContextValue {
  cart: CartItem[];
  cartCount: number;
  itemTotal: number;
  mrpTotal: number;
  productSavings: number;
  deliveryFee: number;
  handlingFee: number;
  freeDeliveryThreshold: number;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  grandTotal: number;
  totalSavings: number;
  favorites: string[];
  addresses: Address[];
  selectedAddress: Address;
  orders: Order[];
  activeOrder: Order | null;
  addToCart: (product: Product) => void;
  decrementFromCart: (productId: string) => void;
  getQuantity: (productId: string) => number;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  selectAddress: (addressId: string) => void;
  addAddress: (label: Address['label'], line1: string, line2: string) => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  placeOrder: (paymentMethod: string) => Order | null;
  advanceOrderStage: (orderId: string) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const FREE_DELIVERY_THRESHOLD = 199;
const BASE_DELIVERY_FEE = 25;
const HANDLING_FEE = 5;

const RIDER_POOL = [
  { name: 'Rahul Sharma', phone: '+91 98765 43210' },
  { name: 'Vikram Patel', phone: '+91 98112 34567' },
  { name: 'Arjun Verma', phone: '+91 97400 11223' },
];

function computeStage(remainingSeconds: number, totalSeconds: number): OrderStage {
  if (remainingSeconds <= 0) return 'delivered';
  const elapsedRatio = 1 - remainingSeconds / totalSeconds;
  if (elapsedRatio < 0.2) return 'confirmed';
  if (elapsedRatio < 0.5) return 'packing';
  if (elapsedRatio < 0.85) return 'out_for_delivery';
  return 'arriving';
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartMap, setCartMap] = useState<Record<string, number>>({
    p5: 1, // Pre-seed 1 milk so user can immediately see live cart pill or remove it
  });
  const [favorites, setFavorites] = useState<string[]>(['p1', 'p5', 'p13']);
  const [addresses, setAddresses] = useState<Address[]>(DEFAULT_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(DEFAULT_ADDRESSES[0].id);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? addresses[0],
    [addresses, selectedAddressId],
  );

  const cart = useMemo<CartItem[]>(() => {
    return Object.entries(cartMap)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const product = PRODUCTS.find((p) => p.id === id);
        return product ? { product, quantity } : null;
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartMap]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const itemTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  );

  const mrpTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0),
    [cart],
  );

  const productSavings = Math.max(0, mrpTotal - itemTotal);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || itemTotal < appliedCoupon.minOrder) return 0;
    if (appliedCoupon.type === 'flat') return appliedCoupon.value;
    if (appliedCoupon.type === 'percent') {
      const raw = Math.round((itemTotal * appliedCoupon.value) / 100);
      return appliedCoupon.maxDiscount ? Math.min(raw, appliedCoupon.maxDiscount) : raw;
    }
    return 0;
  }, [appliedCoupon, itemTotal]);

  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (itemTotal >= FREE_DELIVERY_THRESHOLD) return 0;
    if (appliedCoupon?.type === 'free_delivery') return 0;
    return BASE_DELIVERY_FEE;
  }, [cart.length, itemTotal, appliedCoupon]);

  const handlingFee = cart.length > 0 ? HANDLING_FEE : 0;

  const grandTotal = Math.max(0, itemTotal + deliveryFee + handlingFee - couponDiscount);
  const deliverySavings = cart.length > 0 && deliveryFee === 0 ? BASE_DELIVERY_FEE : 0;
  const totalSavings = productSavings + couponDiscount + deliverySavings;

  // Live countdown tick for active orders
  useEffect(() => {
    const hasActive = orders.some((o) => o.stage !== 'delivered');
    if (!hasActive) return;

    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.stage === 'delivered') return order;
          const totalSec = order.address.etaMins * 60;
          // Progress 6 seconds per real second so live tracking is engaging during demo
          const nextSec = Math.max(0, order.etaSecondsRemaining - 6);
          return {
            ...order,
            etaSecondsRemaining: nextSec,
            stage: computeStage(nextSec, totalSec),
          };
        }),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [orders]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.stage !== 'delivered') ?? orders[0] ?? null,
    [orders],
  );

  const addToCart = (product: Product) => {
    setCartMap((prev) => ({
      ...prev,
      [product.id]: Math.min((prev[product.id] ?? 0) + 1, product.stock),
    }));
  };

  const decrementFromCart = (productId: string) => {
    setCartMap((prev) => {
      const nextQty = (prev[productId] ?? 0) - 1;
      if (nextQty <= 0) {
        const clone = { ...prev };
        delete clone[productId];
        return clone;
      }
      return { ...prev, [productId]: nextQty };
    });
  };

  const getQuantity = (productId: string) => cartMap[productId] ?? 0;

  const clearCart = () => {
    setCartMap({});
    setAppliedCoupon(null);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const selectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  const addAddress = (label: Address['label'], line1: string, line2: string) => {
    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      label,
      line1: line1.trim(),
      line2: line2.trim(),
      etaMins: 8,
    };
    setAddresses((prev) => [newAddr, ...prev]);
    setSelectedAddressId(newAddr.id);
  };

  const applyCoupon = (rawCode: string): { ok: boolean; message: string } => {
    const normalized = rawCode.trim().toUpperCase();
    const found = COUPONS.find((c) => c.code === normalized);
    if (!found) {
      return { ok: false, message: 'Invalid coupon code. Try ZEPTO50, FIRST10 or FREEDEL.' };
    }
    if (itemTotal < found.minOrder) {
      return {
        ok: false,
        message: `Add items worth ₹${found.minOrder - itemTotal} more to apply ${found.code}.`,
      };
    }
    setAppliedCoupon(found);
    return { ok: true, message: `${found.code} applied!` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const placeOrder = (paymentMethod: string): Order | null => {
    if (cart.length === 0) return null;
    const rider = RIDER_POOL[orders.length % RIDER_POOL.length];
    const etaSec = selectedAddress.etaMins * 60;
    const newOrder: Order = {
      id: `QM-${Math.floor(100000 + Math.random() * 900000)}`,
      items: cart,
      itemTotal,
      deliveryFee,
      handlingFee,
      discount: couponDiscount,
      grandTotal,
      totalSavings,
      address: selectedAddress,
      paymentMethod,
      createdAt: Date.now(),
      etaSecondsRemaining: etaSec,
      stage: 'confirmed',
      riderName: rider.name,
      riderPhone: rider.phone,
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const advanceOrderStage = (orderId: string) => {
    const stages: OrderStage[] = [
      'confirmed',
      'packing',
      'out_for_delivery',
      'arriving',
      'delivered',
    ];
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const idx = stages.indexOf(order.stage);
        const nextStage = stages[Math.min(idx + 1, stages.length - 1)];
        const remainingByStage: Record<OrderStage, number> = {
          confirmed: order.address.etaMins * 60,
          packing: Math.round(order.address.etaMins * 60 * 0.7),
          out_for_delivery: Math.round(order.address.etaMins * 60 * 0.35),
          arriving: 90,
          delivered: 0,
        };
        return {
          ...order,
          stage: nextStage,
          etaSecondsRemaining: remainingByStage[nextStage],
        };
      }),
    );
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartCount,
        itemTotal,
        mrpTotal,
        productSavings,
        deliveryFee,
        handlingFee,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        appliedCoupon,
        couponDiscount,
        grandTotal,
        totalSavings,
        favorites,
        addresses,
        selectedAddress,
        orders,
        activeOrder,
        addToCart,
        decrementFromCart,
        getQuantity,
        clearCart,
        toggleFavorite,
        selectAddress,
        addAddress,
        applyCoupon,
        removeCoupon,
        placeOrder,
        advanceOrderStage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
