interface Env {
  DB: D1Database;
  ASSETS: { fetch(req: Request): Promise<Response> };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
}

const RIDER_POOL = [
  { name: 'Rahul Sharma', phone: '+91 98765 43210' },
  { name: 'Vikram Patel', phone: '+91 98112 34567' },
  { name: 'Arjun Verma', phone: '+91 97400 11223' },
];

const STAGES = ['confirmed', 'packing', 'out_for_delivery', 'arriving', 'delivered', 'cancelled'] as const;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function pbkdf2Hex(password: string, salt: string, iterations: number): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

async function hashPassword(password: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = toHex(saltBytes);
  const hash = await pbkdf2Hex(password, salt, 100000);
  return `pbkdf2:100000:${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]) || 100000;
  const salt = parts[2];
  const expected = fromHex(parts[3]);
  const candidate = fromHex(await pbkdf2Hex(password, salt, iterations));
  if (candidate.length !== expected.length) return false;
  return (crypto.subtle as unknown as { timingSafeEqual(a: BufferSource, b: BufferSource): boolean }).timingSafeEqual(
    candidate,
    expected,
  );
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function getAuthenticatedUser(req: Request, db: D1Database): Promise<AuthUser | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  const row = await db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')
       LIMIT 1`,
    )
    .bind(token)
    .first<AuthUser>();
  return row ?? null;
}

function mapCategory(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    shortName: String(row.short_name),
    emoji: String(row.emoji),
    bgColor: String(row.bg_color),
    accentColor: String(row.accent_color),
    tagline: String(row.tagline),
  };
}

function mapProduct(row: Record<string, unknown>) {
  let highlights: string[] = [];
  if (Array.isArray(row.highlights)) {
    highlights = row.highlights as string[];
  } else if (typeof row.highlights === 'string') {
    try {
      highlights = JSON.parse(row.highlights);
    } catch {
      highlights = [];
    }
  }
  return {
    id: String(row.id),
    name: String(row.name),
    brand: String(row.brand),
    categoryId: String(row.category_id),
    unit: String(row.unit),
    price: Number(row.price),
    mrp: Number(row.mrp),
    emoji: String(row.emoji),
    imageUrl: String(row.image_url ?? ''),
    cardBg: String(row.card_bg),
    rating: Number(row.rating),
    deliveryMins: Number(row.delivery_mins),
    description: String(row.description ?? ''),
    highlights,
    isBestseller: Boolean(row.is_bestseller),
    isFlashDeal: Boolean(row.is_flash_deal),
    stock: Number(row.stock),
  };
}

function mapSettings(row: Record<string, unknown> | null) {
  if (!row) {
    return {
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
  }
  return {
    storeName: String(row.store_name),
    tagline: String(row.tagline),
    logoEmoji: String(row.logo_emoji),
    primaryColor: String(row.primary_color),
    accentColor: String(row.accent_color),
    deliveryEtaMins: Number(row.delivery_eta_mins),
    deliveryFee: Number(row.delivery_fee),
    freeDeliveryThreshold: Number(row.free_delivery_threshold),
    handlingFee: Number(row.handling_fee),
    heroBadge: String(row.hero_badge),
    heroTitle: String(row.hero_title),
    heroSubtitle: String(row.hero_subtitle),
    supportPhone: String(row.support_phone),
    supportEmail: String(row.support_email),
    storeAddress: String(row.store_address),
  };
}

function mapCoupon(row: Record<string, unknown>) {
  return {
    code: String(row.code),
    title: String(row.title),
    description: String(row.description),
    minOrder: Number(row.min_order),
    type: String(row.type) as 'flat' | 'percent' | 'free_delivery',
    value: Number(row.value),
    maxDiscount: row.max_discount !== null && row.max_discount !== undefined ? Number(row.max_discount) : undefined,
    isActive: Boolean(row.is_active),
  };
}

function hydrateOrders(
  orderRows: Record<string, unknown>[],
  itemRows: Record<string, unknown>[],
) {
  const itemsByOrder = new Map<string, Record<string, unknown>[]>();
  for (const row of itemRows) {
    const oid = String(row.order_id);
    const list = itemsByOrder.get(oid) ?? [];
    list.push(row);
    itemsByOrder.set(oid, list);
  }

  return orderRows.map((o) => {
    const addr =
      typeof o.address_snapshot === 'string'
        ? JSON.parse(o.address_snapshot)
        : o.address_snapshot;
    const oid = String(o.id);
    const items = (itemsByOrder.get(oid) ?? []).map((it) => ({
      quantity: Number(it.quantity),
      product: {
        id: String(it.product_id),
        name: String(it.product_name),
        brand: 'QuickMart',
        categoryId: 'fruits-veg',
        unit: String(it.unit),
        price: Number(it.price),
        mrp: Number(it.mrp),
        emoji: String(it.product_emoji),
        imageUrl: '',
        cardBg: '#F3EAFF',
        rating: 4.8,
        deliveryMins: Number(addr?.etaMins ?? 8),
        description: '',
        highlights: [],
        stock: 25,
      },
    }));

    return {
      id: oid,
      items,
      itemTotal: Number(o.item_total),
      deliveryFee: Number(o.delivery_fee),
      handlingFee: Number(o.handling_fee),
      discount: Number(o.discount),
      grandTotal: Number(o.grand_total),
      totalSavings: Number(o.total_savings),
      address: addr,
      paymentMethod: String(o.payment_method),
      paymentStatus: String(o.payment_status ?? 'pending'),
      createdAt: new Date(String(o.created_at)).getTime() || Date.now(),
      etaSecondsRemaining: Number(o.eta_seconds_remaining),
      stage: String(o.stage),
      riderName: String(o.rider_name),
      riderPhone: String(o.rider_phone),
    };
  });
}

async function handleApi(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const db = env.DB;

  if (path === '/api/health' && req.method === 'GET') {
    const row = await db.prepare('SELECT COUNT(*) AS count FROM products').first<{ count: number }>();
    return Response.json({ ok: true, db: 'connected', productCount: Number(row?.count ?? 0) });
  }

  if (path === '/api/catalog' && req.method === 'GET') {
    const [cats, prods, settingsRow, couponRows] = await Promise.all([
      db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, name ASC').all(),
      db.prepare('SELECT * FROM products ORDER BY created_at DESC, id ASC').all(),
      db.prepare("SELECT * FROM store_settings WHERE id = 'default' LIMIT 1").first(),
      db.prepare('SELECT * FROM coupons WHERE is_active = 1 ORDER BY min_order ASC').all(),
    ]);
    return Response.json({
      categories: cats.results.map(mapCategory),
      products: prods.results.map(mapProduct),
      settings: mapSettings(settingsRow),
      coupons: couponRows.results.map(mapCoupon),
    });
  }

  if (path === '/api/settings') {
    if (req.method === 'GET') {
      const row = await db.prepare("SELECT * FROM store_settings WHERE id = 'default' LIMIT 1").first();
      return Response.json({ settings: mapSettings(row) });
    }
    if (req.method === 'PUT') {
      const user = await getAuthenticatedUser(req, db);
      if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

      const body = (await req.json()) as Record<string, unknown>;
      const current = mapSettings(
        await db.prepare("SELECT * FROM store_settings WHERE id = 'default' LIMIT 1").first(),
      );

      const next = {
        storeName: String(body.storeName ?? current.storeName).trim() || current.storeName,
        tagline: String(body.tagline ?? current.tagline).trim() || current.tagline,
        logoEmoji: String(body.logoEmoji ?? current.logoEmoji).trim() || current.logoEmoji,
        primaryColor: String(body.primaryColor ?? current.primaryColor).trim() || current.primaryColor,
        accentColor: String(body.accentColor ?? current.accentColor).trim() || current.accentColor,
        deliveryEtaMins: Math.max(1, Math.round(Number(body.deliveryEtaMins ?? current.deliveryEtaMins))),
        deliveryFee: Math.max(0, Math.round(Number(body.deliveryFee ?? current.deliveryFee))),
        freeDeliveryThreshold: Math.max(0, Math.round(Number(body.freeDeliveryThreshold ?? current.freeDeliveryThreshold))),
        handlingFee: Math.max(0, Math.round(Number(body.handlingFee ?? current.handlingFee))),
        heroBadge: String(body.heroBadge ?? current.heroBadge).trim() || current.heroBadge,
        heroTitle: String(body.heroTitle ?? current.heroTitle).trim() || current.heroTitle,
        heroSubtitle: String(body.heroSubtitle ?? current.heroSubtitle).trim() || current.heroSubtitle,
        supportPhone: String(body.supportPhone ?? current.supportPhone).trim() || current.supportPhone,
        supportEmail: String(body.supportEmail ?? current.supportEmail).trim() || current.supportEmail,
        storeAddress: String(body.storeAddress ?? current.storeAddress).trim() || current.storeAddress,
      };

      await db
        .prepare(
          `UPDATE store_settings
           SET store_name = ?, tagline = ?, logo_emoji = ?, primary_color = ?, accent_color = ?,
               delivery_eta_mins = ?, delivery_fee = ?, free_delivery_threshold = ?, handling_fee = ?,
               hero_badge = ?, hero_title = ?, hero_subtitle = ?, support_phone = ?, support_email = ?,
               store_address = ?, updated_at = datetime('now')
           WHERE id = 'default'`,
        )
        .bind(
          next.storeName,
          next.tagline,
          next.logoEmoji,
          next.primaryColor,
          next.accentColor,
          next.deliveryEtaMins,
          next.deliveryFee,
          next.freeDeliveryThreshold,
          next.handlingFee,
          next.heroBadge,
          next.heroTitle,
          next.heroSubtitle,
          next.supportPhone,
          next.supportEmail,
          next.storeAddress,
        )
        .run();

      return Response.json({ settings: next });
    }
  }

  if (path === '/api/coupons') {
    if (req.method === 'GET') {
      const rows = await db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
      return Response.json({ coupons: rows.results.map(mapCoupon) });
    }
    const user = await getAuthenticatedUser(req, db);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    if (req.method === 'POST') {
      const body = (await req.json()) as Record<string, unknown>;
      const code = String(body.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const title = String(body.title ?? '').trim();
      const description = String(body.description ?? '').trim();
      const type = ['flat', 'percent', 'free_delivery'].includes(String(body.type))
        ? String(body.type)
        : 'flat';
      const minOrder = Math.max(1, Math.round(Number(body.minOrder ?? 99)));
      const value = Math.max(0, Math.round(Number(body.value ?? 25)));
      const maxDiscount = body.maxDiscount ? Math.round(Number(body.maxDiscount)) : null;

      if (!code || !title) {
        return Response.json({ error: 'Coupon code and title are required' }, { status: 400 });
      }

      await db
        .prepare(
          `INSERT INTO coupons (code, title, description, min_order, type, value, max_discount, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)
           ON CONFLICT(code) DO UPDATE SET
             title = excluded.title,
             description = excluded.description,
             min_order = excluded.min_order,
             type = excluded.type,
             value = excluded.value,
             max_discount = excluded.max_discount,
             is_active = 1`,
        )
        .bind(code, title, description || `Min order ₹${minOrder}`, minOrder, type, value, maxDiscount)
        .run();

      const saved = await db.prepare('SELECT * FROM coupons WHERE code = ?').bind(code).first();
      return Response.json({ coupon: mapCoupon(saved!) }, { status: 201 });
    }

    if (req.method === 'DELETE') {
      const code = url.searchParams.get('code')?.trim().toUpperCase();
      if (!code) return Response.json({ error: 'Coupon code is required' }, { status: 400 });
      await db.prepare('DELETE FROM coupons WHERE code = ?').bind(code).run();
      return Response.json({ ok: true, code });
    }
  }

  if (path === '/api/admin/stats' && req.method === 'GET') {
    const user = await getAuthenticatedUser(req, db);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const [orderAgg, prodAgg, userAgg] = await Promise.all([
      db
        .prepare(
          `SELECT
             COALESCE(SUM(CASE WHEN stage != 'cancelled' THEN grand_total ELSE 0 END), 0) AS revenue,
             COUNT(*) AS total_orders,
             SUM(CASE WHEN stage NOT IN ('delivered', 'cancelled') THEN 1 ELSE 0 END) AS active_orders,
             SUM(CASE WHEN stage = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
           FROM orders`,
        )
        .first<Record<string, number>>(),
      db
        .prepare('SELECT COUNT(*) AS total_skus, SUM(CASE WHEN stock <= 10 THEN 1 ELSE 0 END) AS low_stock FROM products')
        .first<Record<string, number>>(),
      db.prepare("SELECT COUNT(*) AS customers FROM users WHERE role = 'customer'").first<Record<string, number>>(),
    ]);

    return Response.json({
      stats: {
        totalRevenue: Number(orderAgg?.revenue ?? 0),
        totalOrders: Number(orderAgg?.total_orders ?? 0),
        activeOrders: Number(orderAgg?.active_orders ?? 0),
        cancelledOrders: Number(orderAgg?.cancelled_orders ?? 0),
        totalSkus: Number(prodAgg?.total_skus ?? 0),
        lowStockCount: Number(prodAgg?.low_stock ?? 0),
        totalCustomers: Number(userAgg?.customers ?? 0),
      },
    });
  }

  if (path === '/api/products') {
    const user = await getAuthenticatedUser(req, db);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    if (req.method === 'POST') {
      const body = (await req.json()) as Record<string, unknown>;
      const name = String(body.name ?? '').trim();
      if (!name) return Response.json({ error: 'Product name is required' }, { status: 400 });

      const id = `p-${crypto.randomUUID().slice(0, 8)}`;
      const brand = String(body.brand ?? 'QuickMart').trim();
      const categoryId = String(body.categoryId ?? 'fruits-veg').trim();
      const unit = String(body.unit ?? '1 pc').trim();
      const price = Math.max(1, Math.round(Number(body.price) || 0));
      const mrp = Math.max(price, Math.round(Number(body.mrp) || price));
      const emoji = String(body.emoji ?? '🛒').trim() || '🛒';
      const imageUrl = String(body.imageUrl ?? '').trim();
      const cardBg = String(body.cardBg ?? '#F3EAFF').trim();
      const description = String(body.description ?? 'Freshly stocked for 8-minute delivery.').trim();
      const stock = Math.max(0, Math.round(Number(body.stock ?? 25)));
      const isFlashDeal = body.isFlashDeal ? 1 : 0;
      const isBestseller = body.isBestseller ? 1 : 0;
      const highlights = JSON.stringify(['Freshly stocked', 'Express delivery', 'Quality checked']);

      await db
        .prepare(
          `INSERT INTO products (id, name, brand, category_id, unit, price, mrp, emoji, image_url, card_bg, rating, delivery_mins, description, highlights, is_bestseller, is_flash_deal, stock)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.8, 8, ?, ?, ?, ?, ?)`,
        )
        .bind(id, name, brand, categoryId, unit, price, mrp, emoji, imageUrl, cardBg, description, highlights, isBestseller, isFlashDeal, stock)
        .run();

      const created = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
      return Response.json({ product: mapProduct(created!) }, { status: 201 });
    }

    if (req.method === 'PATCH') {
      const body = (await req.json()) as Record<string, unknown>;
      const id = String(body.id ?? '').trim();
      const existing = await db.prepare('SELECT * FROM products WHERE id = ? LIMIT 1').bind(id).first();
      if (!existing) return Response.json({ error: 'Product not found' }, { status: 404 });

      const nextName = body.name !== undefined ? String(body.name).trim() || String(existing.name) : String(existing.name);
      const nextBrand = body.brand !== undefined ? String(body.brand).trim() || String(existing.brand) : String(existing.brand);
      const nextUnit = body.unit !== undefined ? String(body.unit).trim() || String(existing.unit) : String(existing.unit);
      const nextCategory = body.categoryId !== undefined ? String(body.categoryId).trim() : String(existing.category_id);
      const nextEmoji = body.emoji !== undefined ? String(body.emoji).trim() || String(existing.emoji) : String(existing.emoji);
      const nextImageUrl = body.imageUrl !== undefined ? String(body.imageUrl).trim() : String(existing.image_url ?? '');
      const nextDescription = body.description !== undefined ? String(body.description).trim() : String(existing.description ?? '');
      const nextPrice = body.price !== undefined ? Math.max(1, Math.round(Number(body.price))) : Number(existing.price);
      const nextMrp = body.mrp !== undefined ? Math.max(nextPrice, Math.round(Number(body.mrp))) : Math.max(nextPrice, Number(existing.mrp));
      const nextStock = body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock))) : Number(existing.stock);
      const nextFlash = body.isFlashDeal !== undefined ? (body.isFlashDeal ? 1 : 0) : Number(existing.is_flash_deal);
      const nextBest = body.isBestseller !== undefined ? (body.isBestseller ? 1 : 0) : Number(existing.is_bestseller);

      await db
        .prepare(
          `UPDATE products
           SET name = ?, brand = ?, unit = ?, category_id = ?, emoji = ?, image_url = ?,
               description = ?, price = ?, mrp = ?, stock = ?, is_flash_deal = ?, is_bestseller = ?
           WHERE id = ?`,
        )
        .bind(
          nextName,
          nextBrand,
          nextUnit,
          nextCategory,
          nextEmoji,
          nextImageUrl,
          nextDescription,
          nextPrice,
          nextMrp,
          nextStock,
          nextFlash,
          nextBest,
          id,
        )
        .run();

      const updated = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
      return Response.json({ product: mapProduct(updated!) });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id')?.trim();
      if (!id) return Response.json({ error: 'Product id is required' }, { status: 400 });
      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
      return Response.json({ ok: true, id });
    }
  }

  if (path === '/api/auth/me' && req.method === 'GET') {
    const user = await getAuthenticatedUser(req, db);
    if (!user) return Response.json({ user: null }, { status: 401 });
    return Response.json({ user });
  }

  if (path === '/api/auth/logout' && req.method === 'POST') {
    const token = extractBearerToken(req);
    if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return Response.json({ ok: true });
  }

  if (path === '/api/auth/register' && req.method === 'POST') {
    const body = (await req.json()) as Record<string, unknown>;
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = String(body.phone ?? '').trim();
    const password = String(body.password ?? '');

    if (!name || !email || !email.includes('@')) {
      return Response.json({ error: 'Valid name and email are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(email).first();
    if (existing) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = await hashPassword(password);
    const addrId = `addr-${crypto.randomUUID().slice(0, 8)}`;
    const token = randomToken();

    await db.batch([
      db.prepare('INSERT INTO users (id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(userId, name, email, phone, 'customer', passwordHash),
      db.prepare('INSERT INTO addresses (id, user_id, label, line1, line2, eta_mins) VALUES (?, ?, ?, ?, ?, 8)')
        .bind(addrId, userId, 'Home', 'Flat 101, Green View Apartments', 'Sector 2, HSR Layout, Bengaluru'),
      db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))")
        .bind(token, userId),
    ]);

    return Response.json(
      { token, user: { id: userId, name, email, phone, role: 'customer' } },
      { status: 201 },
    );
  }

  if (path === '/api/auth/login' && req.method === 'POST') {
    const body = (await req.json()) as Record<string, unknown>;
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const row = await db
      .prepare('SELECT id, name, email, phone, role, password_hash FROM users WHERE email = ? LIMIT 1')
      .bind(email)
      .first<AuthUser & { password_hash: string }>();

    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = randomToken();
    await db
      .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))")
      .bind(token, row.id)
      .run();

    return Response.json({
      token,
      user: { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role },
    });
  }

  if (path === '/api/addresses') {
    const user = await getAuthenticatedUser(req, db);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    if (req.method === 'GET') {
      const rows = await db
        .prepare('SELECT id, label, line1, line2, eta_mins FROM addresses WHERE user_id = ? ORDER BY created_at DESC')
        .bind(user.id)
        .all();
      return Response.json({
        addresses: rows.results.map((r) => ({
          id: String(r.id),
          label: String(r.label),
          line1: String(r.line1),
          line2: String(r.line2),
          etaMins: Number(r.eta_mins),
        })),
      });
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as Record<string, unknown>;
      const label = ['Home', 'Work', 'Other'].includes(String(body.label)) ? String(body.label) : 'Other';
      const line1 = String(body.line1 ?? '').trim();
      const line2 = String(body.line2 ?? '').trim();
      if (!line1 || !line2) {
        return Response.json({ error: 'Address line1 and line2 are required' }, { status: 400 });
      }
      const id = `addr-${crypto.randomUUID().slice(0, 8)}`;
      await db
        .prepare('INSERT INTO addresses (id, user_id, label, line1, line2, eta_mins) VALUES (?, ?, ?, ?, ?, 8)')
        .bind(id, user.id, label, line1, line2)
        .run();
      return Response.json({ address: { id, label, line1, line2, etaMins: 8 } }, { status: 201 });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id')?.trim();
      if (!id) return Response.json({ error: 'Address id is required' }, { status: 400 });
      await db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').bind(id, user.id).run();
      return Response.json({ ok: true });
    }
  }

  if (path === '/api/orders/cancel' && req.method === 'POST') {
    const user = await getAuthenticatedUser(req, db);
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const body = (await req.json()) as { orderId?: string };
    const orderId = String(body.orderId ?? '').trim();
    const existing = await db.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind(orderId).first();
    if (!existing) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (String(existing.user_id) !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['confirmed', 'packing'].includes(String(existing.stage))) {
      return Response.json({ error: 'Order cannot be cancelled once out for delivery' }, { status: 400 });
    }

    const itemRows = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all();
    const stmts: D1PreparedStatement[] = [
      db.prepare("UPDATE orders SET stage = 'cancelled', eta_seconds_remaining = 0 WHERE id = ?").bind(orderId),
    ];
    for (const row of itemRows.results) {
      stmts.push(
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').bind(Number(row.quantity), String(row.product_id)),
      );
    }
    await db.batch(stmts);

    const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
    const [hydrated] = hydrateOrders([updated!], itemRows.results);
    return Response.json({ order: hydrated });
  }

  if (path === '/api/orders') {
    const user = await getAuthenticatedUser(req, db);

    if (req.method === 'GET') {
      if (!user) return Response.json({ orders: [] });
      const wantAll = url.searchParams.get('scope') === 'all' && user.role === 'admin';
      const orderRes = wantAll
        ? await db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50').all()
        : await db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').bind(user.id).all();

      if (orderRes.results.length === 0) return Response.json({ orders: [] });
      const ids = orderRes.results.map((r) => String(r.id));
      const placeholders = ids.map(() => '?').join(',');
      const itemRes = await db
        .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
        .bind(...ids)
        .all();

      return Response.json({ orders: hydrateOrders(orderRes.results, itemRes.results) });
    }

    if (req.method === 'POST') {
      if (!user) return Response.json({ error: 'Please sign in to place a real order' }, { status: 401 });
      const body = (await req.json()) as {
        items?: Array<{ productId: string; quantity: number }>;
        address?: Record<string, unknown>;
        paymentMethod?: string;
        couponCode?: string | null;
      };
      const rawItems = Array.isArray(body.items) ? body.items : [];
      const address = body.address;
      const paymentMethod = String(body.paymentMethod ?? 'UPI • GPay / PhonePe');

      if (rawItems.length === 0 || !address?.line1) {
        return Response.json({ error: 'Cart items and delivery address are required' }, { status: 400 });
      }

      const settings = mapSettings(
        await db.prepare("SELECT * FROM store_settings WHERE id = 'default' LIMIT 1").first(),
      );

      let itemTotal = 0;
      let mrpTotal = 0;
      const verifiedItems: Array<{
        productId: string;
        name: string;
        emoji: string;
        unit: string;
        price: number;
        mrp: number;
        quantity: number;
      }> = [];

      for (const reqItem of rawItems) {
        const qty = Math.max(1, Math.round(Number(reqItem.quantity) || 0));
        const prod = await db
          .prepare('SELECT id, name, emoji, unit, price, mrp, stock FROM products WHERE id = ? LIMIT 1')
          .bind(reqItem.productId)
          .first<{ id: string; name: string; emoji: string; unit: string; price: number; mrp: number; stock: number }>();
        if (!prod) {
          return Response.json({ error: `Product ${reqItem.productId} is unavailable` }, { status: 400 });
        }
        if (Number(prod.stock) < qty) {
          return Response.json({ error: `Only ${prod.stock} left for ${prod.name}` }, { status: 400 });
        }
        itemTotal += Number(prod.price) * qty;
        mrpTotal += Number(prod.mrp) * qty;
        verifiedItems.push({
          productId: prod.id,
          name: prod.name,
          emoji: prod.emoji,
          unit: prod.unit,
          price: Number(prod.price),
          mrp: Number(prod.mrp),
          quantity: qty,
        });
      }

      let couponCode: string | null = null;
      let couponDiscount = 0;
      let freeDeliveryCoupon = false;

      if (body.couponCode) {
        const codeUpper = String(body.couponCode).trim().toUpperCase();
        const couponRow = await db
          .prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1 LIMIT 1')
          .bind(codeUpper)
          .first();
        if (couponRow && itemTotal >= Number(couponRow.min_order)) {
          couponCode = String(couponRow.code);
          const type = String(couponRow.type);
          const value = Number(couponRow.value);
          const maxDisc = couponRow.max_discount !== null && couponRow.max_discount !== undefined ? Number(couponRow.max_discount) : null;
          if (type === 'flat') {
            couponDiscount = value;
          } else if (type === 'percent') {
            const raw = Math.round((itemTotal * value) / 100);
            couponDiscount = maxDisc ? Math.min(raw, maxDisc) : raw;
          } else if (type === 'free_delivery') {
            freeDeliveryCoupon = true;
          }
        }
      }

      const deliveryFee =
        itemTotal >= settings.freeDeliveryThreshold || freeDeliveryCoupon
          ? 0
          : settings.deliveryFee;
      const handlingFee = settings.handlingFee;
      const grandTotal = Math.max(0, itemTotal + deliveryFee + handlingFee - couponDiscount);
      const deliverySavings = deliveryFee === 0 ? settings.deliveryFee : 0;
      const totalSavings = Math.max(0, mrpTotal - itemTotal) + couponDiscount + deliverySavings;

      const orderId = `QM-${Math.floor(100000 + Math.random() * 900000)}`;
      const etaMins = Number(address.etaMins || settings.deliveryEtaMins);
      const etaSec = etaMins * 60;
      const rider = RIDER_POOL[Math.floor(Math.random() * RIDER_POOL.length)];
      const paymentStatus = paymentMethod.toLowerCase().includes('cash') ? 'cod_pending' : 'paid_verified';

      const stmts: D1PreparedStatement[] = [
        db
          .prepare(
            `INSERT INTO orders (id, user_id, item_total, delivery_fee, handling_fee, discount, grand_total, total_savings, coupon_code, address_snapshot, payment_method, payment_status, stage, eta_seconds_remaining, rider_name, rider_phone)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
          )
          .bind(
            orderId,
            user.id,
            itemTotal,
            deliveryFee,
            handlingFee,
            couponDiscount,
            grandTotal,
            totalSavings,
            couponCode,
            JSON.stringify(address),
            paymentMethod,
            paymentStatus,
            etaSec,
            rider.name,
            rider.phone,
          ),
      ];

      for (const item of verifiedItems) {
        stmts.push(
          db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').bind(item.quantity, item.productId),
          db
            .prepare(
              'INSERT INTO order_items (order_id, product_id, product_name, product_emoji, unit, price, mrp, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            )
            .bind(orderId, item.productId, item.name, item.emoji, item.unit, item.price, item.mrp, item.quantity),
        );
      }

      await db.batch(stmts);

      const created = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
      const itemRows = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all();
      const [hydrated] = hydrateOrders([created!], itemRows.results);
      return Response.json({ order: hydrated }, { status: 201 });
    }

    if (req.method === 'PATCH') {
      if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
      const body = (await req.json()) as { orderId?: string; stage?: string };
      const orderId = String(body.orderId ?? '').trim();
      const existing = await db.prepare('SELECT * FROM orders WHERE id = ? LIMIT 1').bind(orderId).first();
      if (!existing) return Response.json({ error: 'Order not found' }, { status: 404 });
      if (String(existing.user_id) !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (String(existing.stage) === 'cancelled') {
        return Response.json({ error: 'Cancelled order cannot advance' }, { status: 400 });
      }

      const activeStages = ['confirmed', 'packing', 'out_for_delivery', 'arriving', 'delivered'] as const;
      const currentIdx = activeStages.indexOf(String(existing.stage) as (typeof activeStages)[number]);
      const nextStage =
        body.stage && STAGES.includes(body.stage as (typeof STAGES)[number])
          ? body.stage
          : activeStages[Math.min(currentIdx + 1, activeStages.length - 1)];
      const etaMap: Record<string, number> = {
        confirmed: 480,
        packing: 330,
        out_for_delivery: 180,
        arriving: 90,
        delivered: 0,
        cancelled: 0,
      };

      await db
        .prepare('UPDATE orders SET stage = ?, eta_seconds_remaining = ? WHERE id = ?')
        .bind(nextStage, etaMap[nextStage] ?? 0, orderId)
        .run();

      const updated = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();
      const itemRows = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all();
      const [hydrated] = hydrateOrders([updated!], itemRows.results);
      return Response.json({ order: hydrated });
    }
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(req, env);
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : 'Internal server error' },
          { status: 500 },
        );
      }
    }
    return env.ASSETS.fetch(req);
  },
};
