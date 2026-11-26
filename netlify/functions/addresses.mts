import crypto from 'crypto';
import type { Config } from '@netlify/functions';
import { getDatabase } from '@netlify/database';
import { getAuthenticatedUser } from '../lib/auth';

interface AddressRow {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  line1: string;
  line2: string;
  eta_mins: number;
}

function mapAddress(row: AddressRow) {
  return {
    id: row.id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    etaMins: Number(row.eta_mins),
  };
}

export default async (req: Request) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const db = getDatabase();

  if (req.method === 'GET') {
    const rows = await db.sql<AddressRow>`
      SELECT id, label, line1, line2, eta_mins
      FROM addresses
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;
    return Response.json({ addresses: rows.map(mapAddress) });
  }

  if (req.method === 'POST') {
    const body = await req.json();
    const label = ['Home', 'Work', 'Other'].includes(body.label) ? body.label : 'Other';
    const line1 = String(body.line1 ?? '').trim();
    const line2 = String(body.line2 ?? '').trim();

    if (!line1 || !line2) {
      return Response.json({ error: 'Address line1 and line2 are required' }, { status: 400 });
    }

    const id = `addr-${crypto.randomBytes(5).toString('hex')}`;
    const [created] = await db.sql<AddressRow>`
      INSERT INTO addresses (id, user_id, label, line1, line2, eta_mins)
      VALUES (${id}, ${user.id}, ${label}, ${line1}, ${line2}, 8)
      RETURNING id, label, line1, line2, eta_mins
    `;
    return Response.json({ address: mapAddress(created) }, { status: 201 });
  }

  if (req.method === 'DELETE') {
    const id = new URL(req.url).searchParams.get('id')?.trim();
    if (!id) {
      return Response.json({ error: 'Address id is required' }, { status: 400 });
    }
    await db.sql`DELETE FROM addresses WHERE id = ${id} AND user_id = ${user.id}`;
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
};

export const config: Config = {
  path: '/api/addresses',
  method: ['GET', 'POST', 'DELETE'],
};
