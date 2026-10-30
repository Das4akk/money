/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';
import { CRMStatus } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { ids, crmStatus } = await req.json();
  if (!Array.isArray(ids) || !crmStatus) {
    return NextResponse.json({ error: 'ids and crmStatus required' }, { status: 400 });
  }

  const idSet = new Set(ids);
  const leads = loadLeads();
  for (const l of leads) {
    if (idSet.has(l.id)) {
      l.crmStatus = crmStatus as CRMStatus;
    }
  }
  saveLeads(leads);
  return NextResponse.json({ success: true, count: idSet.size });
}
