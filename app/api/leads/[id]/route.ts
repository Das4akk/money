/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';
import {
  normalizeRussianPhone,
  classifyWebsiteStatus,
  cleanVkUrl,
  extractTelegramUsername,
  resolveTelegramContact,
  calculateLostProfitAudit,
} from '@/lib/leadLogic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const leads = loadLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }
  return NextResponse.json(lead);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leads = loadLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const current = leads[index];
    const updates = await req.json();

    if (updates.phone !== undefined && updates.phone !== current.phone) {
      const phoneData = normalizeRussianPhone(updates.phone);
      updates.phone = phoneData.normalized;
      updates.formattedPhone = phoneData.display;
      updates.whatsappPhone = phoneData.whatsappLink ? phoneData.normalized?.replace('+', '') : undefined;
      updates.hasWhatsapp = Boolean(phoneData.whatsappLink);
    }

    if (updates.telegram !== undefined) {
      const cleanTg = extractTelegramUsername(updates.telegram);
      updates.telegram = cleanTg || updates.telegram;
      const resTg = resolveTelegramContact(updates.telegram, updates.phone || current.phone);
      if (resTg.hasTelegramDirect) {
        updates.telegramUrl = resTg.telegramUrl;
        updates.telegramType = resTg.telegramType;
        updates.hasTelegramDirect = true;
      }
    }

    if (updates.vk !== undefined) {
      updates.vk = cleanVkUrl(updates.vk) || updates.vk;
    }

    if (updates.website !== undefined && updates.website !== current.website) {
      const webData = classifyWebsiteStatus(updates.website);
      updates.websiteStatus = updates.websiteStatus || webData.status;
      if (webData.cleanDomain) {
        updates.verifiedDomains = Array.from(
          new Set([...(current.verifiedDomains || []), webData.cleanDomain])
        );
      }
    }

    const updatedLead = {
      ...current,
      ...updates,
      lastCheckedDate: new Date().toISOString().split('T')[0],
    };

    if (!updatedLead.estimatedLossMonthly) {
      const audit = calculateLostProfitAudit(updatedLead);
      updatedLead.estimatedLossMonthly = audit.monthlyLossMin;
    }

    leads[index] = updatedLead;
    saveLeads(leads);
    return NextResponse.json(updatedLead);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let leads = loadLeads();
  const beforeLen = leads.length;
  leads = leads.filter((l) => l.id !== id);
  if (leads.length === beforeLen) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }
  saveLeads(leads);
  return NextResponse.json({ success: true, count: leads.length });
}
