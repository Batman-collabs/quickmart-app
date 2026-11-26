import crypto from 'crypto';
import type { Config } from '@netlify/functions';
import { getDatabase } from '@netlify/database';
import { getAuthenticatedUser } from '../lib/auth';

interface CategoryRow {
  id: string;
  name: string;
  short_name: string;
  emoji: string;
  bg_color: string;
  accent_color: string;
  tagline: string;
}

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  category_id: string;
  unit: string;
  price: number;
  mrp: number;
  emoji: string;
  card_bg: string;
  rating: string | number;
  delivery_mins: number;
  description: string;
  highlights: string[] | string;
  is_bestseller: boolean;
  is_flash_deal: boolean;
  stock: number;
}

function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    emoji: row.emoji,
    bgColor: row.bg_color,
    accentColor: row.accent_color,
    tagline: row.tagline,
  };
}

function mapProduct(row: ProductRow) {
  const highlights = Array.isArray(row.highlights)
    ? row.highlights
    : typeof row.highlights === 'string'
    ? JSON.parse(row.highlights)
    : [];

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    unit: row.unit,
    price: Number(row.price),
    mrp: Number(row.mrp),
    emoji: row.emoji,
    cardBg: row.card_bg,
    rating: Number(row.rating),
    deliveryMins: Number(row.delivery_mins),
    description: row.description,
    highlights,
    isBestseller: Boolean(row.is_bestseller),
    isFlashDeal: Boolean(row.is_flash_deal),
    stock: Number(row.stock),
  };
}

export default async (req: Request) => {
  const db = getDatabase();
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const [categories, products] = await Promise.all([
      db.sql<CategoryRow>`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`,
      db.sql<ProductRow>`SELECT * FROM products ORDER BY created_at DESC, id ASC`,
    ]);
    return Response.json({
      categories: categories.map(mapCategory),
      products: products.map(mapProduct),
    });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const brand = String(body.brand ?? 'QuickMart').trim();
    const categoryId = String(body.categoryId ?? 'fruits-veg').trim();
    const unit = String(body.unit ?? '1 pc').trim();
    const price = Math.max(1, Math.round(Number(body.price) || 0));
    const mrp = Math.max(price, Math.round(Number(body.mrp) || price));
    const emoji = String(body.emoji ?? '🛒').trim() || '🛒';
    const cardBg = String(body.cardBg ?? '#F3EAFF').trim();
    const description = String(body.description ?? 'Freshly stocked for 8-minute delivery.').trim();
    const stock = Math.max(0, Math.round(Number(body.stock ?? 25)));
    const isFlashDeal = Boolean(body.isFlashDeal);
    const isBestseller = Boolean(body.isBestseller);

    if (!name) {
      return Response.json({ error: 'Product name is required' }, { status: 400 });
    }

    const id = `p-${crypto.randomBytes(4).toString('hex')}`;
    const highlights = JSON.stringify(['Freshly stocked', '8-min delivery', 'Quality checked']);

    const [created] = await db.sql<ProductRow>`
      INSERT INTO products (
        id, name, brand, category_id, unit, price, mrp, emoji, card_bg,
        rating, delivery_mins, description, highlights, is_bestseller, is_flash_deal, stock
      ) VALUES (
        ${id}, ${name}, ${brand}, ${categoryId}, ${unit}, ${price}, ${mrp}, ${emoji}, ${cardBg},
        4.8, 8, ${description}, ${highlights}::jsonb, ${isBestseller}, ${isFlashDeal}, ${stock}
      )
      RETURNING *
    `;

    return Response.json({ product: mapProduct(created) }, { status: 201 });
  }

  if (req.method === 'PATCH') {
    const body = await req.json();
    const id = String(body.id ?? '').trim();
    if (!id) {
      return Response.json({ error: 'Product id is required' }, { status: 400 });
    }

    const existingRows = await db.sql<ProductRow>`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    const existing = existingRows[0];
    if (!existing) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const nextPrice = body.price !== undefined ? Math.max(1, Math.round(Number(body.price))) : existing.price;
    const nextMrp = body.mrp !== undefined ? Math.max(nextPrice, Math.round(Number(body.mrp))) : Math.max(nextPrice, existing.mrp);
    const nextStock = body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock))) : existing.stock;
    const nextFlash = body.isFlashDeal !== undefined ? Boolean(body.isFlashDeal) : existing.is_flash_deal;
    const nextBestseller = body.isBestseller !== undefined ? Boolean(body.isBestseller) : existing.is_bestseller;

    const [updated] = await db.sql<ProductRow>`
      UPDATE products
      SET price = ${nextPrice},
          mrp = ${nextMrp},
          stock = ${nextStock},
          is_flash_deal = ${nextFlash},
          is_bestseller = ${nextBestseller}
      WHERE id = ${id}
      RETURNING *
    `;

    return Response.json({ product: mapProduct(updated) });
  }

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id')?.trim();
    if (!id) {
      return Response.json({ error: 'Product id is required' }, { status: 400 });
    }
    await db.sql`DELETE FROM products WHERE id = ${id}`;
    return Response.json({ ok: true, id });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config: Config = {
  path: ['/api/catalog', '/api/products'],
  method: ['GET', 'POST', 'PATCH', 'DELETE'],
};
