/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { ids, isFavorite } = await req.json();
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const idSet = new Set(ids);
  const leads = loadLeads();
  for (const l of leads) {
    if (idSet.has(l.id)) {
      l.isFavorite = Boolean(isFavorite);
    }
  }
  saveLeads(leads);
  return NextResponse.json({ success: true, count: idSet.size });
}
