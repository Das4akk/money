/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadSettings, saveSettings } from '@/lib/db';
import { AppSettings } from '@/lib/types';

export async function GET() {
  const settings = loadSettings();
  const safeSettings = {
    ...settings,
    twoGisApiKey: settings.twoGisApiKey ? `••••••••${settings.twoGisApiKey.slice(-4)}` : '',
    yandexApiKey: settings.yandexApiKey ? `••••••••${settings.yandexApiKey.slice(-4)}` : '',
    googlePlacesApiKey: settings.googlePlacesApiKey ? `••••••••${settings.googlePlacesApiKey.slice(-4)}` : '',
    dadataApiKey: settings.dadataApiKey ? `••••••••${settings.dadataApiKey.slice(-4)}` : '',
    hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    overpassStatus: 'ACTIVE',
  };
  return NextResponse.json(safeSettings);
}

export async function POST(req: NextRequest) {
  const current = loadSettings();
  const updates = await req.json();

  const newSettings: AppSettings = {
    ...current,
    senderName: updates.senderName ?? current.senderName,
    companyName: updates.companyName ?? current.companyName,
    senderRole: updates.senderRole ?? current.senderRole,
    portfolioUrl: updates.portfolioUrl ?? current.portfolioUrl,
    customSignature: updates.customSignature ?? current.customSignature,
    twoGisApiKey: updates.twoGisApiKey && !updates.twoGisApiKey.includes('••••') ? updates.twoGisApiKey : current.twoGisApiKey,
    yandexApiKey: updates.yandexApiKey && !updates.yandexApiKey.includes('••••') ? updates.yandexApiKey : current.yandexApiKey,
    googlePlacesApiKey: updates.googlePlacesApiKey && !updates.googlePlacesApiKey.includes('••••') ? updates.googlePlacesApiKey : current.googlePlacesApiKey,
    dadataApiKey: updates.dadataApiKey && !updates.dadataApiKey.includes('••••') ? updates.dadataApiKey : current.dadataApiKey,
    crawlerTimeoutSeconds: updates.crawlerTimeoutSeconds ?? current.crawlerTimeoutSeconds,
    enableOverpass: updates.enableOverpass ?? current.enableOverpass,
    rateLimitPerMinute: updates.rateLimitPerMinute ?? current.rateLimitPerMinute,
    autoCheckWebsites: updates.autoCheckWebsites ?? current.autoCheckWebsites,
  };

  saveSettings(newSettings);
  return NextResponse.json({ success: true, message: 'Настройки успешно сохранены', settings: newSettings });
}
