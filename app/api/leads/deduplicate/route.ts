/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';
import { BryanskLead } from '@/lib/types';

export async function POST() {
  const leads = loadLeads();
  const seen = new Set<string>();
  const deduplicated: BryanskLead[] = [];
  let duplicatesRemoved = 0;

  for (const lead of leads) {
    const keyPhone = lead.phone ? `phone:${lead.phone}` : null;
    const keyNameAddr = `name:${lead.name.toLowerCase().trim()}|addr:${lead.address.toLowerCase().trim()}`;

    if ((keyPhone && seen.has(keyPhone)) || seen.has(keyNameAddr)) {
      duplicatesRemoved++;
      continue;
    }

    if (keyPhone) seen.add(keyPhone);
    seen.add(keyNameAddr);
    deduplicated.push(lead);
  }

  saveLeads(deduplicated);
  return NextResponse.json({
    success: true,
    duplicatesRemoved,
    remainingCount: deduplicated.length,
  });
}
