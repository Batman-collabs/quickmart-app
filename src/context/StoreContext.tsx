import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CATEGORIES, COUPONS, DEFAULT_ADDRESSES, PRODUCTS } from '../data/catalog';
import { api, getStoredToken, setStoredToken } from '../services/api';
import {
  Address,
  AdminStats,
  CartItem,
  Category,
  Coupon,
  Order,
  OrderStage,
  Product,
  StoreSettings,
  User,
} from '../types';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'QuickMart',
  tagline: '10-Minute Express Delivery',
  logoEmoji: '⚡',
  primaryColor: '#4B0082',
  accentColor: '#FF3269',
  deliveryEtaMins: 8,
  deliveryFee: 25,
  freeDeliveryThreshold: 199,
  handlingFee: 5,
  heroBadge: 'QUICKMART SUPER SAVER',
  heroTitle: 'Flat ₹50 OFF on Fresh Groceries',
  heroSubtitle: 'Delivered to your doorstep in 8 minutes flat',
  supportPhone: '+91 98000 00001',
  supportEmail: 'support@quickmart.app',
  storeAddress: 'HSR Layout Sector 2, Bengaluru, Karnataka 560102',
};

interface StoreContextValue {
  user: User | null;
  dbConnected: boolean;
  loadingCatalog: boolean;
  settings: StoreSettings;
  coupons: Coupon[];
  categories: Category[];
  products: Product[];
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
  allOrders: Order[];
  adminStats: AdminStats | null;
  activeOrder: Order | null;
  addToCart: (product: Product) => void;
  decrementFromCart: (productId: string) => void;
  getQuantity: (productId: string) => number;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  selectAddress: (addressId: string) => void;
  addAddress: (label: Address['label'], line1: string, line2: string) => Promise<void>;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  placeOrder: (paymentMethod: string) => Promise<{ ok: boolean; order?: Order; error?: string }>;
  advanceOrderStage: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, phone: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  loadAllOrders: () => Promise<void>;
  loadAdminStats: () => Promise<void>;
  updateSettings: (payload: Partial<StoreSettings>) => Promise<StoreSettings>;
  createCoupon: (payload: Partial<Coupon>) => Promise<Coupon>;
  deleteCoupon: (code: string) => Promise<void>;
  createProduct: (payload: Partial<Product>) => Promise<Product>;
  updateProduct: (payload: Partial<Product> & { id: string }) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

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
  const [user, setUser] = useState<User | null>(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cartMap, setCartMap] = useState<Record<string, number>>({ p5: 1 });
  const [favorites, setFavorites] = useState<string[]>(['p1', 'p5', 'p13']);
  const [addresses, setAddresses] = useState<Address[]>(DEFAULT_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(DEFAULT_ADDRESSES[0].id);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      const [addrRes, orderRes] = await Promise.all([api.getAddresses(), api.getOrders()]);
      if (addrRes.addresses.length > 0) {
        setAddresses(addrRes.addresses);
        setSelectedAddressId(addrRes.addresses[0].id);
      }
      setOrders(orderRes.orders);
    } catch {
      // Ignore if backend unavailable
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const data = await api.getCatalog();
      if (data.categories.length > 0) setCategories(data.categories);
      if (data.products.length > 0) setProducts(data.products);
      if (data.settings) setSettings(data.settings);
      if (data.coupons) setCoupons(data.coupons);
      setDbConnected(true);
    } catch {
      setDbConnected(false);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshCatalog();
      const token = getStoredToken();
      if (token) {
        try {
          const { user: me } = await api.me();
          setUser(me);
          await loadUserData();
        } catch {
          setStoredToken(null);
        }
      }
    })();
  }, [refreshCatalog, loadUserData]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? addresses[0],
    [addresses, selectedAddressId],
  );

  const cart = useMemo<CartItem[]>(() => {
    return Object.entries(cartMap)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => {
        const product = products.find((p) => p.id === id);
        return product ? { product, quantity } : null;
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartMap, products]);

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
    if (itemTotal >= settings.freeDeliveryThreshold) return 0;
    if (appliedCoupon?.type === 'free_delivery') return 0;
    return settings.deliveryFee;
  }, [cart.length, itemTotal, appliedCoupon, settings.freeDeliveryThreshold, settings.deliveryFee]);

  const handlingFee = cart.length > 0 ? settings.handlingFee : 0;
  const grandTotal = Math.max(0, itemTotal + deliveryFee + handlingFee - couponDiscount);
  const deliverySavings = cart.length > 0 && deliveryFee === 0 ? settings.deliveryFee : 0;
  const totalSavings = productSavings + couponDiscount + deliverySavings;

  useEffect(() => {
    const hasActive = orders.some(
      (o) => o.stage !== 'delivered' && o.stage !== 'cancelled',
    );
    if (!hasActive) return;

    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.stage === 'delivered' || order.stage === 'cancelled') return order;
          const totalSec = (order.address?.etaMins || settings.deliveryEtaMins) * 60;
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
  }, [orders, settings.deliveryEtaMins]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.stage !== 'delivered' && o.stage !== 'cancelled') ?? orders[0] ?? null,
    [orders],
  );

  const addToCart = (product: Product) => {
    setCartMap((prev) => ({
      ...prev,
      [product.id]: Math.min((prev[product.id] ?? 0) + 1, Math.max(1, product.stock)),
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

  const addAddress = async (label: Address['label'], line1: string, line2: string) => {
    if (dbConnected && user) {
      const { address } = await api.createAddress({
        label,
        line1: line1.trim(),
        line2: line2.trim(),
      });
      setAddresses((prev) => [address, ...prev]);
      setSelectedAddressId(address.id);
      return;
    }

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      label,
      line1: line1.trim(),
      line2: line2.trim(),
      etaMins: settings.deliveryEtaMins,
    };
    setAddresses((prev) => [newAddr, ...prev]);
    setSelectedAddressId(newAddr.id);
  };

  const applyCoupon = (rawCode: string): { ok: boolean; message: string } => {
    const normalized = rawCode.trim().toUpperCase();
    const found = coupons.find((c) => c.code === normalized);
    if (!found) {
      return { ok: false, message: 'Invalid coupon code.' };
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

  const placeOrder = async (
    paymentMethod: string,
  ): Promise<{ ok: boolean; order?: Order; error?: string }> => {
    if (cart.length === 0) return { ok: false, error: 'Cart is empty' };

    if (dbConnected) {
      if (!user) return { ok: false, error: 'AUTH_REQUIRED' };
      try {
        const { order } = await api.createOrder({
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
          address: selectedAddress,
          paymentMethod,
          couponCode: appliedCoupon?.code ?? null,
        });
        setOrders((prev) => [order, ...prev]);
        clearCart();
        void refreshCatalog();
        return { ok: true, order };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Failed to place order',
        };
      }
    }

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
      paymentStatus: 'demo',
      createdAt: Date.now(),
      etaSecondsRemaining: etaSec,
      stage: 'confirmed',
      riderName: rider.name,
      riderPhone: rider.phone,
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return { ok: true, order: newOrder };
  };

  const advanceOrderStage = async (orderId: string) => {
    if (dbConnected && user) {
      try {
        const { order } = await api.advanceOrder(orderId);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
        setAllOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
        return;
      } catch {
        // Fallback below
      }
    }

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
        if (idx === -1) return order;
        const nextStage = stages[Math.min(idx + 1, stages.length - 1)];
        const remainingByStage: Record<string, number> = {
          confirmed: order.address.etaMins * 60,
          packing: Math.round(order.address.etaMins * 60 * 0.7),
          out_for_delivery: Math.round(order.address.etaMins * 60 * 0.35),
          arriving: 90,
          delivered: 0,
        };
        return {
          ...order,
          stage: nextStage,
          etaSecondsRemaining: remainingByStage[nextStage] ?? 0,
        };
      }),
    );
  };

  const cancelOrder = async (orderId: string) => {
    if (dbConnected && user) {
      const { order } = await api.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
      setAllOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
      void refreshCatalog();
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, stage: 'cancelled', etaSecondsRemaining: 0 } : o,
      ),
    );
  };

  const login = async (email: string, password: string): Promise<User> => {
    const { token, user: loggedUser } = await api.login({ email, password });
    setStoredToken(token);
    setUser(loggedUser);
    await loadUserData();
    return loggedUser;
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<User> => {
    const { token, user: createdUser } = await api.register({ name, email, phone, password });
    setStoredToken(token);
    setUser(createdUser);
    await loadUserData();
    return createdUser;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    }
    setStoredToken(null);
    setUser(null);
    setOrders([]);
    setAllOrders([]);
    setAdminStats(null);
    setAddresses(DEFAULT_ADDRESSES);
    setSelectedAddressId(DEFAULT_ADDRESSES[0].id);
  };

  const loadAllOrders = useCallback(async () => {
    if (!dbConnected || user?.role !== 'admin') return;
    try {
      const res = await api.getOrders('all');
      setAllOrders(res.orders);
    } catch {
      // Ignore
    }
  }, [dbConnected, user?.role]);

  const loadAdminStats = useCallback(async () => {
    if (!dbConnected || user?.role !== 'admin') return;
    try {
      const res = await api.getAdminStats();
      setAdminStats(res.stats);
    } catch {
      // Ignore
    }
  }, [dbConnected, user?.role]);

  const updateSettings = async (payload: Partial<StoreSettings>) => {
    const { settings: updated } = await api.updateSettings(payload);
    setSettings(updated);
    return updated;
  };

  const createCoupon = async (payload: Partial<Coupon>) => {
    const { coupon } = await api.createCoupon(payload);
    setCoupons((prev) => [coupon, ...prev.filter((c) => c.code !== coupon.code)]);
    return coupon;
  };

  const deleteCoupon = async (code: string) => {
    await api.deleteCoupon(code);
    setCoupons((prev) => prev.filter((c) => c.code !== code));
  };

  const createProduct = async (payload: Partial<Product>) => {
    const { product } = await api.createProduct(payload);
    setProducts((prev) => [product, ...prev]);
    return product;
  };

  const updateProduct = async (payload: Partial<Product> & { id: string }) => {
    const { product } = await api.updateProduct(payload);
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    return product;
  };

  const deleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        dbConnected,
        loadingCatalog,
        settings,
        coupons,
        categories,
        products,
        cart,
        cartCount,
        itemTotal,
        mrpTotal,
        productSavings,
        deliveryFee,
        handlingFee,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        appliedCoupon,
        couponDiscount,
        grandTotal,
        totalSavings,
        favorites,
        addresses,
        selectedAddress,
        orders,
        allOrders,
        adminStats,
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
        cancelOrder,
        login,
        register,
        logout,
        refreshCatalog,
        loadAllOrders,
        loadAdminStats,
        updateSettings,
        createCoupon,
        deleteCoupon,
        createProduct,
        updateProduct,
        deleteProduct,
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
