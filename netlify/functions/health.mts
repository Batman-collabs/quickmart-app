import type { Config } from '@netlify/functions';
import { getDatabase } from '@netlify/database';

export default async () => {
  try {
    const db = getDatabase();
    const [{ count }] = await db.sql<{ count: string }>`SELECT COUNT(*)::text AS count FROM products`;
    return Response.json({ ok: true, db: 'connected', productCount: Number(count) });
  } catch (error) {
    return Response.json(
      { ok: false, db: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
};

export const config: Config = {
  path: '/api/health',
  method: ['GET'],
};
