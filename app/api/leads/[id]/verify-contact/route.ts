/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';
import {
  extractTelegramUsername,
  resolveTelegramContact,
  cleanVkUrl,
} from '@/lib/leadLogic';

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

  const body = await req.json();
  const { action, value, note } = body;

  if (action === 'verify-tg') {
    lead.isTgVerified = true;
    lead.tgVerificationNote = note || 'Подтверждено вручную';
  } else if (action === 'clear-tg') {
    lead.telegram = undefined;
    lead.telegramUrl = undefined;
    lead.telegramType = undefined;
    lead.hasTelegramDirect = false;
    lead.isTgVerified = false;
    lead.tgVerificationNote = 'Отмечен как неверный и очищен';
  } else if (action === 'set-tg') {
    const rawVal = (value || '').trim();
    const cleanTg = extractTelegramUsername(rawVal);
    lead.telegram = cleanTg || (rawVal ? `@${rawVal.replace('@', '')}` : undefined);
    const resTg = resolveTelegramContact(lead.telegram, lead.phone);
    if (resTg.hasTelegramDirect) {
      lead.telegramUrl = resTg.telegramUrl;
      lead.telegramType = resTg.telegramType;
      lead.hasTelegramDirect = true;
    }
    lead.isTgVerified = true;
    lead.tgVerificationNote = note || 'Установлен и проверен вручную';
  } else if (action === 'verify-vk') {
    lead.isVkVerified = true;
    lead.vkVerificationNote = note || 'Группа VK проверена вручную';
  } else if (action === 'clear-vk') {
    lead.vk = undefined;
    lead.isVkVerified = false;
    lead.vkVerificationNote = 'Отмечен как неверный и очищен';
  } else if (action === 'set-vk') {
    lead.vk = cleanVkUrl(value) || value;
    lead.isVkVerified = true;
    lead.vkVerificationNote = note || 'Установлен и проверен вручную';
  }

  lead.lastCheckedDate = new Date().toISOString().split('T')[0];
  saveLeads(leads);

  return NextResponse.json({
    success: true,
    lead,
    message: 'Контакты успешно обновлены',
  });
}
