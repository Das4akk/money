/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads, saveLeads } from '@/lib/db';
import {
  normalizeRussianPhone,
  classifyWebsiteStatus,
  calculateLeadPotential,
  extractTelegramUsername,
  cleanVkUrl,
  calculateLostProfitAudit,
} from '@/lib/leadLogic';
import { BryanskLead } from '@/lib/types';

export async function GET() {
  const leads = loadLeads();
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leads = loadLeads();

    const phoneData = normalizeRussianPhone(body.phone);
    const webData = classifyWebsiteStatus(body.website, body.otherLinks || []);
    const potential = calculateLeadPotential({
      websiteStatus: webData.status,
      phone: phoneData.normalized,
      reviewsCount: body.reviewsCount || 0,
      category: body.category || 'Другие локальные предприятия',
      rating: body.rating || 0,
    });

    const audit = calculateLostProfitAudit({
      category: body.category || 'Другие локальные предприятия',
      district: body.district || 'Советский район',
      name: body.name,
    });

    const newLead: BryanskLead = {
      id: `lead-manual-${Date.now()}`,
      name: body.name || 'Организация Брянска',
      category: body.category || 'Другие локальные предприятия',
      address: body.address || 'г. Брянск',
      district: body.district || 'Советский район',
      lat: body.lat,
      lon: body.lon,
      phone: phoneData.normalized,
      formattedPhone: phoneData.display,
      whatsappPhone: phoneData.whatsappLink ? phoneData.normalized?.replace('+', '') : undefined,
      hasWhatsapp: Boolean(phoneData.whatsappLink),
      telegram: extractTelegramUsername(body.telegram),
      isTgVerified: body.isTgVerified ?? false,
      vk: cleanVkUrl(body.vk) || webData.vkLink,
      isVkVerified: body.isVkVerified ?? false,
      website: body.website,
      verifiedDomains: webData.cleanDomain ? [webData.cleanDomain] : [],
      websiteStatus: body.websiteStatus || webData.status,
      confidence: 'HIGH',
      reviewsCount: body.reviewsCount || 0,
      rating: body.rating || 5.0,
      source: 'Manual',
      foundDate: new Date().toISOString().split('T')[0],
      lastCheckedDate: new Date().toISOString().split('T')[0],
      potential: body.potential || potential,
      crmStatus: 'NEW',
      notes: body.notes || '',
      isFavorite: false,
      interactions: [],
      estimatedLossMonthly: audit.monthlyLossMin,
    };

    leads.unshift(newLead);
    saveLeads(leads);
    return NextResponse.json(newLead, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
