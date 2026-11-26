import crypto from 'crypto';
import type { Config } from '@netlify/functions';
import { getDatabase } from '@netlify/database';
import {
  extractBearerToken,
  getAuthenticatedUser,
  hashPassword,
  verifyPassword,
} from '../lib/auth';

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  password_hash: string;
}

async function createSession(userId: string): Promise<string> {
  const db = getDatabase();
  const token = crypto.randomBytes(32).toString('hex');
  await db.sql`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (${token}, ${userId}, NOW() + INTERVAL '30 days')
  `;
  return token;
}

export default async (req: Request) => {
  const db = getDatabase();
  const pathname = new URL(req.url).pathname;

  if (pathname.endsWith('/me') && req.method === 'GET') {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return Response.json({ user: null }, { status: 401 });
    }
    return Response.json({ user });
  }

  if (pathname.endsWith('/logout') && req.method === 'POST') {
    const token = extractBearerToken(req);
    if (token) {
      await db.sql`DELETE FROM sessions WHERE token = ${token}`;
    }
    return Response.json({ ok: true });
  }

  if (pathname.endsWith('/register') && req.method === 'POST') {
    const body = await req.json();
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

    const existing = await db.sql<{ id: string }>`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const userId = `usr-${crypto.randomBytes(6).toString('hex')}`;
    const passwordHash = hashPassword(password);

    const [created] = await db.sql<UserRow>`
      INSERT INTO users (id, name, email, phone, role, password_hash)
      VALUES (${userId}, ${name}, ${email}, ${phone}, 'customer', ${passwordHash})
      RETURNING id, name, email, phone, role, password_hash
    `;

    const addrId = `addr-${crypto.randomBytes(5).toString('hex')}`;
    await db.sql`
      INSERT INTO addresses (id, user_id, label, line1, line2, eta_mins)
      VALUES (${addrId}, ${userId}, 'Home', 'Flat 101, Green View Apartments', 'Sector 2, HSR Layout, Bengaluru', 8)
    `;

    const token = await createSession(created.id);
    return Response.json(
      {
        token,
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          phone: created.phone,
          role: created.role,
        },
      },
      { status: 201 },
    );
  }

  if (pathname.endsWith('/login') && req.method === 'POST') {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rows = await db.sql<UserRow>`
      SELECT id, name, email, phone, role, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createSession(user.id);
    return Response.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
};

export const config: Config = {
  path: ['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/me'],
  method: ['GET', 'POST'],
};
