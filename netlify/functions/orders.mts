import type { Config } from '@netlify/functions';
import { getDatabase } from '@netlify/database';
import { getAuthenticatedUser } from '../lib/auth';

const FREE_DELIVERY_THRESHOLD = 199;
const BASE_DELIVERY_FEE = 25;
const HANDLING_FEE = 5;

const RIDER_POOL = [
  { name: 'Rahul Sharma', phone: '+91 98765 43210' },
  { name: 'Vikram Patel', phone: '+91 98112 34567' },
  { name: 'Arjun Verma', phone: '+91 97400 11223' },
];

const STAGES = ['confirmed', 'packing', 'out_for_delivery', 'arriving', 'delivered'] as const;

interface OrderRow {
  id: string;
  user_id: string | null;
  item_total: number;
  delivery_fee: number;
  handling_fee: number;
  discount: number;
  grand_total: number;
  total_savings: number;
  coupon_code: string | null;
  address_snapshot: string | Record<string, unknown>;
  payment_method: string;
  stage: (typeof STAGES)[number];
  eta_seconds_remaining: number;
  rider_name: string;
  rider_phone: string;
  created_at: string;
}

interface OrderItemRow {
  order_id: string;
  product_id: string;
  product_name: string;
  product_emoji: string;
  unit: string;
  price: number;
  mrp: number;
  quantity: number;
}

function computeCouponDiscount(code: string | null | undefined, itemTotal: number) {
  const normalized = (code ?? '').trim().toUpperCase();
  if (normalized === 'ZEPTO50' && itemTotal >= 249) {
    return { couponCode: 'ZEPTO50', discount: 50, freeDelivery: false };
  }
  if (normalized === 'FIRST10' && itemTotal >= 149) {
    return {
      couponCode: 'FIRST10',
      discount: Math.min(75, Math.round(itemTotal * 0.1)),
      freeDelivery: false,
    };
  }
  if (normalized === 'FREEDEL' && itemTotal >= 1) {
    return { couponCode: 'FREEDEL', discount: 0, freeDelivery: true };
  }
  return { couponCode: null, discount: 0, freeDelivery: false };
}

function hydrateOrders(orderRows: OrderRow[], itemRows: OrderItemRow[]) {
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.order_id) ?? [];
    list.push(row);
    itemsByOrder.set(row.order_id, list);
  }

  return orderRows.map((o) => {
    const addr =
      typeof o.address_snapshot === 'string'
        ? JSON.parse(o.address_snapshot)
        : o.address_snapshot;
    const items = (itemsByOrder.get(o.id) ?? []).map((it) => ({
      quantity: Number(it.quantity),
      product: {
        id: it.product_id,
        name: it.product_name,
        brand: 'QuickMart',
        categoryId: 'fruits-veg',
        unit: it.unit,
        price: Number(it.price),
        mrp: Number(it.mrp),
        emoji: it.product_emoji,
        cardBg: '#F3EAFF',
        rating: 4.8,
        deliveryMins: Number(addr?.etaMins ?? 8),
        description: '',
        highlights: [],
        stock: 25,
      },
    }));

    return {
      id: o.id,
      items,
      itemTotal: Number(o.item_total),
      deliveryFee: Number(o.delivery_fee),
      handlingFee: Number(o.handling_fee),
      discount: Number(o.discount),
      grandTotal: Number(o.grand_total),
      totalSavings: Number(o.total_savings),
      address: addr,
      paymentMethod: o.payment_method,
      createdAt: new Date(o.created_at).getTime(),
      etaSecondsRemaining: Number(o.eta_seconds_remaining),
      stage: o.stage,
      riderName: o.rider_name,
      riderPhone: o.rider_phone,
    };
  });
}

export default async (req: Request) => {
  const user = await getAuthenticatedUser(req);
  const db = getDatabase();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    if (!user) {
      return Response.json({ orders: [] });
    }

    const wantAll = url.searchParams.get('scope') === 'all' && user.role === 'admin';
    const orderRows = wantAll
      ? await db.sql<OrderRow>`SELECT * FROM orders ORDER BY created_at DESC LIMIT 50`
      : await db.sql<OrderRow>`SELECT * FROM orders WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 30`;

    if (orderRows.length === 0) {
      return Response.json({ orders: [] });
    }

    const orderIds = orderRows.map((o) => o.id);
    const itemRows = await db.sql<OrderItemRow>`
      SELECT * FROM order_items WHERE order_id = ANY(${orderIds})
    `;

    return Response.json({ orders: hydrateOrders(orderRows, itemRows) });
  }

  if (req.method === 'POST') {
    if (!user) {
      return Response.json({ error: 'Please sign in to place a real order' }, { status: 401 });
    }

    const body = await req.json();
    const rawItems: Array<{ productId: string; quantity: number }> = Array.isArray(body.items)
      ? body.items
      : [];
    const address = body.address;
    const paymentMethod = String(body.paymentMethod ?? 'UPI • GPay / PhonePe');

    if (rawItems.length === 0 || !address?.line1) {
      return Response.json({ error: 'Cart items and delivery address are required' }, { status: 400 });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

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
        const res = await client.query<{
          id: string;
          name: string;
          emoji: string;
          unit: string;
          price: number;
          mrp: number;
          stock: number;
        }>(
          'SELECT id, name, emoji, unit, price, mrp, stock FROM products WHERE id = $1 FOR UPDATE',
          [reqItem.productId],
        );

        const prod = res.rows[0];
        if (!prod) {
          throw new Error(`Product ${reqItem.productId} is no longer available`);
        }
        if (prod.stock < qty) {
          throw new Error(`Only ${prod.stock} left for ${prod.name}`);
        }

        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [qty, prod.id]);

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

      const coupon = computeCouponDiscount(body.couponCode, itemTotal);
      const deliveryFee =
        itemTotal >= FREE_DELIVERY_THRESHOLD || coupon.freeDelivery ? 0 : BASE_DELIVERY_FEE;
      const handlingFee = HANDLING_FEE;
      const grandTotal = Math.max(0, itemTotal + deliveryFee + handlingFee - coupon.discount);
      const deliverySavings = deliveryFee === 0 ? BASE_DELIVERY_FEE : 0;
      const totalSavings = Math.max(0, mrpTotal - itemTotal) + coupon.discount + deliverySavings;

      const orderId = `QM-${Math.floor(100000 + Math.random() * 900000)}`;
      const etaMins = Number(address.etaMins || 8);
      const etaSec = etaMins * 60;
      const rider = RIDER_POOL[Math.floor(Math.random() * RIDER_POOL.length)];

      const orderRes = await client.query<OrderRow>(
        `INSERT INTO orders (
          id, user_id, item_total, delivery_fee, handling_fee, discount,
          grand_total, total_savings, coupon_code, address_snapshot,
          payment_method, stage, eta_seconds_remaining, rider_name, rider_phone
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,'confirmed',$12,$13,$14)
        RETURNING *`,
        [
          orderId,
          user.id,
          itemTotal,
          deliveryFee,
          handlingFee,
          coupon.discount,
          grandTotal,
          totalSavings,
          coupon.couponCode,
          JSON.stringify(address),
          paymentMethod,
          etaSec,
          rider.name,
          rider.phone,
        ],
      );

      for (const item of verifiedItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, product_emoji, unit, price, mrp, quantity
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            orderId,
            item.productId,
            item.name,
            item.emoji,
            item.unit,
            item.price,
            item.mrp,
            item.quantity,
          ],
        );
      }

      await client.query('COMMIT');

      const [hydrated] = hydrateOrders(
        orderRes.rows,
        verifiedItems.map((i) => ({
          order_id: orderId,
          product_id: i.productId,
          product_name: i.name,
          product_emoji: i.emoji,
          unit: i.unit,
          price: i.price,
          mrp: i.mrp,
          quantity: i.quantity,
        })),
      );

      return Response.json({ order: hydrated }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      return Response.json(
        { error: err instanceof Error ? err.message : 'Failed to place order' },
        { status: 400 },
      );
    } finally {
      client.release();
    }
  }

  if (req.method === 'PATCH') {
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    const body = await req.json();
    const orderId = String(body.orderId ?? '').trim();
    const rows = await db.sql<OrderRow>`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`;
    const existing = rows[0];
    if (!existing) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (existing.user_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentIdx = STAGES.indexOf(existing.stage);
    const nextStage =
      body.stage && STAGES.includes(body.stage)
        ? body.stage
        : STAGES[Math.min(currentIdx + 1, STAGES.length - 1)];
    const etaMap: Record<string, number> = {
      confirmed: 480,
      packing: 330,
      out_for_delivery: 180,
      arriving: 90,
      delivered: 0,
    };

    const [updated] = await db.sql<OrderRow>`
      UPDATE orders
      SET stage = ${nextStage}, eta_seconds_remaining = ${etaMap[nextStage] ?? 0}
      WHERE id = ${orderId}
      RETURNING *
    `;

    const itemRows = await db.sql<OrderItemRow>`SELECT * FROM order_items WHERE order_id = ${orderId}`;
    const [hydrated] = hydrateOrders([updated], itemRows);
    return Response.json({ order: hydrated });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config: Config = {
  path: '/api/orders',
  method: ['GET', 'POST', 'PATCH'],
};
