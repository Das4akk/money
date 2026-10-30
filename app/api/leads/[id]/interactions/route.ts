/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leads = loadLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const { type, text, author } = await req.json();
  const newLog = {
    id: `int-${Date.now()}`,
    date: new Date().toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: type || 'note',
    text: text || '',
    author: author || 'Даниил (FORM STUDIO)',
  };

  lead.interactions.unshift(newLog);
  saveLeads(leads);
  return NextResponse.json(newLog);
}
