/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  BryanskLead,
  AppSettings,
  DashboardStats,
  ScanState,
  District,
} from './types';
import { INITIAL_BRYANSK_LEADS } from './seedData';
import {
  resolveTelegramContact,
  cleanVkUrl,
  calculateLostProfitAudit,
} from './leadLogic';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'bryansk_leads.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  senderName: 'Даниил',
  companyName: 'FORM STUDIO',
  senderRole: 'Основатель FORM STUDIO / Разработка конверсионных сайтов и онлайн-записи',
  portfolioUrl: 'https://formstudio.ru',
  customSignature: 'С уважением, Даниил | FORM STUDIO (Брянск) — сайты с конверсией от 5%',
  twoGisApiKey: '',
  yandexApiKey: '',
  googlePlacesApiKey: '',
  dadataApiKey: '',
  crawlerTimeoutSeconds: 30,
  enableOverpass: true,
  rateLimitPerMinute: 60,
  autoCheckWebsites: true,
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function enrichLeadContacts(lead: BryanskLead): BryanskLead {
  // Enrich telegram contact if needed
  const tgData = resolveTelegramContact(lead.telegram, lead.phone);
  let updated = { ...lead };

  if (tgData.hasTelegramDirect && (!updated.telegramUrl || !updated.telegramType)) {
    updated.telegram = updated.telegram || tgData.telegram;
    updated.telegramUrl = updated.telegramUrl || tgData.telegramUrl;
    updated.telegramType = updated.telegramType || tgData.telegramType;
    updated.hasTelegramDirect = true;
  }

  // Clean VK url
  if (updated.vk) {
    const cleaned = cleanVkUrl(updated.vk);
    if (cleaned) {
      updated.vk = cleaned;
    }
  }

  // Calculate estimated monthly loss if missing
  if (!updated.estimatedLossMonthly) {
    const audit = calculateLostProfitAudit(updated);
    updated.estimatedLossMonthly = audit.monthlyLossMin;
  }

  return updated;
}

export function loadSettings(): AppSettings {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export function loadLeads(): BryanskLead[] {
  ensureDataDir();
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(enrichLeadContacts);
      }
    }
  } catch (err) {
    console.error('Error reading leads file:', err);
  }

  const enriched = INITIAL_BRYANSK_LEADS.map(enrichLeadContacts);
  saveLeads(enriched);
  return enriched;
}

export function saveLeads(leads: BryanskLead[]): void {
  ensureDataDir();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

export function calculateDashboardStats(leads: BryanskLead[]): DashboardStats {
  const todayStr = new Date().toISOString().split('T')[0];

  const totalEstimatedLoss = leads.reduce((acc, lead) => {
    if (lead.websiteStatus === 'NO_WEBSITE' || lead.websiteStatus === 'SOCIAL_ONLY') {
      const audit = calculateLostProfitAudit(lead);
      return acc + audit.monthlyLossMin;
    }
    return acc;
  }, 0);

  return {
    total: leads.length,
    noWebsite: leads.filter((l) => l.websiteStatus === 'NO_WEBSITE').length,
    hasWebsite: leads.filter((l) => l.websiteStatus === 'HAS_WEBSITE').length,
    socialOnly: leads.filter((l) => l.websiteStatus === 'SOCIAL_ONLY').length,
    directoryOnly: leads.filter((l) => l.websiteStatus === 'DIRECTORY_ONLY').length,
    needsReview: leads.filter((l) => l.websiteStatus === 'NEEDS_REVIEW').length,
    websiteInactive: leads.filter((l) => l.websiteStatus === 'WEBSITE_INACTIVE').length,
    phonesFound: leads.filter((l) => Boolean(l.phone && l.phone.trim())).length,
    telegramFound: leads.filter((l) => Boolean(l.telegram && l.telegram.trim())).length,
    telegramChannelsFound: leads.filter((l) => l.telegramType === 'channel' || l.telegram?.startsWith('@')).length,
    telegramDirectFound: leads.filter((l) => l.telegramType === 'direct_phone' || l.hasTelegramDirect).length,
    whatsappFound: leads.filter((l) => Boolean(l.hasWhatsapp)).length,
    vkFound: leads.filter((l) => Boolean(l.vk && l.vk.trim())).length,
    newToday: leads.filter((l) => l.foundDate === todayStr).length,
    highPotential: leads.filter((l) => l.potential === 'HIGH').length,
    mediumPotential: leads.filter((l) => l.potential === 'MEDIUM').length,
    lowPotential: leads.filter((l) => l.potential === 'LOW').length,
    totalEstimatedLoss,
    byDistrict: {
      'Советский район': leads.filter((l) => l.district === 'Советский район').length,
      'Бежицкий район': leads.filter((l) => l.district === 'Бежицкий район').length,
      'Володарский район': leads.filter((l) => l.district === 'Володарский район').length,
      'Фокинский район': leads.filter((l) => l.district === 'Фокинский район').length,
    },
    byCrmStatus: {
      NEW: leads.filter((l) => l.crmStatus === 'NEW').length,
      NOT_CONTACTED: leads.filter((l) => l.crmStatus === 'NOT_CONTACTED').length,
      CONTACTED_TG: leads.filter((l) => l.crmStatus === 'CONTACTED_TG').length,
      CONTACTED_WA: leads.filter((l) => l.crmStatus === 'CONTACTED_WA').length,
      CONTACTED_VK: leads.filter((l) => l.crmStatus === 'CONTACTED_VK').length,
      CALLED: leads.filter((l) => l.crmStatus === 'CALLED').length,
      AWAITING_REPLY: leads.filter((l) => l.crmStatus === 'AWAITING_REPLY').length,
      INTERESTED: leads.filter((l) => l.crmStatus === 'INTERESTED').length,
      REJECTED: leads.filter((l) => l.crmStatus === 'REJECTED').length,
      CLIENT: leads.filter((l) => l.crmStatus === 'CLIENT').length,
      ARCHIVED: leads.filter((l) => l.crmStatus === 'ARCHIVED').length,
    },
  };
}

// Global active scan state using globalThis for cross-route sharing in Next.js
const globalForScan = globalThis as unknown as {
  activeScanState?: ScanState;
};

export const activeScanState: ScanState =
  globalForScan.activeScanState || {
    isScanning: false,
    progress: 0,
    totalFound: 0,
    currentCategory: '',
    currentDistrict: '',
    logs: [],
  };

globalForScan.activeScanState = activeScanState;

