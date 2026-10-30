/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const idSet = new Set(ids);
  let leads = loadLeads();
  leads = leads.filter((l) => !idSet.has(l.id));
  saveLeads(leads);
  return NextResponse.json({ success: true, count: leads.length });
}
