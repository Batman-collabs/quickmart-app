import { Platform } from 'react-native';
import { Address, Category, Order, OrderStage, Product, User } from '../types';

const TOKEN_KEY = 'quickmart_auth_token_v1';
const NATIVE_API_BASE = 'https://quickmart-aayush.netlify.app';

let memoryToken: string | null = null;

function getBaseUrl(): string {
  if (Platform.OS === 'web') {
    return '';
  }
  return NATIVE_API_BASE;
}

export function getStoredToken(): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return memoryToken;
}

export function setStoredToken(token: string | null) {
  memoryToken = token;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Unexpected server response');
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean; db: string; productCount: number }>('/api/health'),

  getCatalog: () =>
    request<{ categories: Category[]; products: Product[] }>('/api/catalog'),

  createProduct: (payload: Partial<Product>) =>
    request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (payload: Partial<Product> & { id: string }) =>
    request<{ product: Product }>('/api/products', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  register: (payload: { name: string; email: string; phone: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  me: () => request<{ user: User }>('/api/auth/me'),

  getAddresses: () => request<{ addresses: Address[] }>('/api/addresses'),

  createAddress: (payload: { label: Address['label']; line1: string; line2: string }) =>
    request<{ address: Address }>('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrders: (scope?: 'all') =>
    request<{ orders: Order[] }>(
      scope === 'all' ? '/api/orders?scope=all' : '/api/orders',
    ),

  createOrder: (payload: {
    items: Array<{ productId: string; quantity: number }>;
    address: Address;
    paymentMethod: string;
    couponCode?: string | null;
  }) =>
    request<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  advanceOrder: (orderId: string, stage?: OrderStage) =>
    request<{ order: Order }>('/api/orders', {
      method: 'PATCH',
      body: JSON.stringify({ orderId, stage }),
    }),
};
