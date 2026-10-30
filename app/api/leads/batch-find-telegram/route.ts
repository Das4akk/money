/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';
import { resolveTelegramContact } from '@/lib/leadLogic';

export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  const leads = loadLeads();
  const targetLeads = Array.isArray(ids) && ids.length > 0
    ? leads.filter((l) => ids.includes(l.id))
    : leads;

  let updatedCount = 0;
  for (const lead of targetLeads) {
    const resolved = resolveTelegramContact(lead.telegram, lead.phone);
    if (resolved.hasTelegramDirect && (!lead.telegramUrl || !lead.telegramType)) {
      lead.telegram = resolved.telegram;
      lead.telegramUrl = resolved.telegramUrl;
      lead.telegramType = resolved.telegramType;
      lead.hasTelegramDirect = true;
      updatedCount++;
    }
  }

  saveLeads(leads);
  return NextResponse.json({ success: true, updatedCount, totalLeads: targetLeads.length });
}
