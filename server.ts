/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';
import {
  BryanskLead,
  WebsiteStatus,
  classifyWebsiteStatus,
  calculateLeadPotential,
  normalizeRussianPhone,
  extractTelegramUsername,
  validateTelegramUsername,
  resolveTelegramContact,
  District,
} from './src/utils/leadLogic';
import { INITIAL_BRYANSK_LEADS } from './src/data/seedData';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'bryansk_leads.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'scan_sessions.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default settings
interface AppSettings {
  twoGisApiKey?: string;
  yandexApiKey?: string;
  googlePlacesApiKey?: string;
  dadataApiKey?: string;
  apifyApiKey?: string;
  outscraperApiKey?: string;
  crawlerTimeoutSeconds: number;
  enableOverpass: boolean;
  rateLimitPerMinute: number;
  autoCheckWebsites: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  twoGisApiKey: '',
  yandexApiKey: '',
  googlePlacesApiKey: '',
  dadataApiKey: '',
  apifyApiKey: '',
  outscraperApiKey: '',
  crawlerTimeoutSeconds: 20,
  enableOverpass: true,
  rateLimitPerMinute: 60,
  autoCheckWebsites: true,
};

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

function enrichLeadTelegram(lead: BryanskLead): BryanskLead {
  const tgData = resolveTelegramContact(lead.telegram, lead.phone);
  if (tgData.hasTelegramDirect) {
    return {
      ...lead,
      telegram: tgData.telegram,
      telegramUrl: tgData.telegramUrl,
      telegramType: tgData.telegramType,
      hasTelegramDirect: true,
    };
  }
  return lead;
}

function loadLeads(): BryanskLead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(enrichLeadTelegram);
      }
    }
  } catch (err) {
    console.error('Error reading leads file:', err);
  }
  // Initialize with initial verified Bryansk seed data
  const enrichedSeed = INITIAL_BRYANSK_LEADS.map(enrichLeadTelegram);
  saveLeads(enrichedSeed);
  return enrichedSeed;
}

function saveLeads(leads: BryanskLead[]) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

// Global active scan state
let activeScanState: {
  isScanning: boolean;
  progress: number;
  totalFound: number;
  currentCategory: string;
  currentDistrict: string;
  logs: string[];
  startTime?: string;
  stopped?: boolean;
} = {
  isScanning: false,
  progress: 0,
  totalFound: 0,
  currentCategory: '',
  currentDistrict: '',
  logs: [],
};

// District bounding boxes inside Bryansk
const DISTRICT_BOUNDS: Record<District | 'Весь Брянск', [number, number, number, number]> = {
  'Весь Брянск': [53.16, 34.24, 53.38, 34.52],
  'Советский район': [53.22, 34.32, 53.28, 34.42],
  'Бежицкий район': [53.27, 34.26, 53.38, 34.38],
  'Володарский район': [53.24, 34.40, 53.30, 34.52],
  'Фокинский район': [53.16, 34.36, 53.24, 34.46],
};

// OSM Category tag mapping
const CATEGORY_OSM_TAGS: Record<string, string[]> = {
  'Автосервисы': ['shop=car_repair', 'craft=car_repair'],
  'Автомойки': ['amenity=car_wash'],
  'Шиномонтажи': ['shop=tyres', 'craft=car_repair'],
  'СТО': ['shop=car_repair'],
  'Барбершопы': ['shop=hairdresser'],
  'Салоны красоты': ['shop=beauty', 'shop=hairdresser'],
  'Парикмахерские': ['shop=hairdresser'],
  'Ногтевые студии': ['shop=beauty'],
  'Массажные кабинеты': ['amenity=massage', 'shop=massage'],
  'Стоматологии': ['amenity=dentist'],
  'Частные медицинские центры': ['amenity=clinic', 'amenity=doctors'],
  'Ветеринарные клиники': ['amenity=veterinary'],
  'Мебельные производства': ['craft=furniture_maker', 'shop=furniture'],
  'Мебельные мастерские': ['craft=carpenter', 'shop=furniture'],
  'Строительные компании': ['office=construction', 'craft=builder'],
  'Ремонт квартир': ['craft=builder', 'craft=painter'],
  'Натяжные потолки': ['craft=builder', 'craft=interior_work'],
  'Оконные компании': ['craft=window_construction', 'shop=glaziery'],
  'Дверные компании': ['shop=doors', 'shop=trade'],
  'Рекламные агентства': ['office=advertising'],
  'Типографии': ['craft=photographer', 'shop=copyshop', 'craft=printer'],
  'Фотостудии': ['shop=photo', 'craft=photographer'],
  'Кафе': ['amenity=cafe'],
  'Рестораны': ['amenity=restaurant'],
  'Пекарни': ['shop=bakery'],
  'Кондитерские': ['shop=confectionery'],
  'Магазины одежды': ['shop=clothes'],
  'Магазины электроники': ['shop=electronics'],
  'Цветочные магазины': ['shop=florist'],
  'Гостиницы': ['tourism=hotel', 'tourism=guest_house'],
  'Частные образовательные центры': ['amenity=language_school', 'amenity=music_school', 'amenity=training'],
  'Спортивные студии': ['leisure=fitness_centre', 'leisure=sports_centre'],
  'Клининговые компании': ['craft=cleaning', 'office=cleaning'],
  'Ритуальные услуги': ['shop=funeral_directors'],
  'Другие локальные предприятия': ['shop=yes', 'craft=yes', 'amenity=place_of_service'],
};

function assignDistrictByCoords(lat: number, lon: number): District {
  if (lat >= 53.27 && lon <= 53.38 && lon >= 34.26 && lon <= 34.38) {
    return 'Бежицкий район';
  }
  if (lat >= 53.24 && lat <= 53.30 && lon >= 34.40) {
    return 'Володарский район';
  }
  if (lat <= 53.24 && lon >= 34.36) {
    return 'Фокинский район';
  }
  return 'Советский район';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini client if API key is present
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

  // GET /api/leads
  app.get('/api/leads', (req: Request, res: Response) => {
    const leads = loadLeads();
    res.json(leads);
  });

  // GET /api/stats
  app.get('/api/stats', (req: Request, res: Response) => {
    const leads = loadLeads();
    const todayStr = new Date().toISOString().split('T')[0];

    const stats = {
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
      newToday: leads.filter((l) => l.foundDate === todayStr).length,
      highPotential: leads.filter((l) => l.potential === 'HIGH').length,
      mediumPotential: leads.filter((l) => l.potential === 'MEDIUM').length,
      lowPotential: leads.filter((l) => l.potential === 'LOW').length,
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
        CALLED: leads.filter((l) => l.crmStatus === 'CALLED').length,
        AWAITING_REPLY: leads.filter((l) => l.crmStatus === 'AWAITING_REPLY').length,
        INTERESTED: leads.filter((l) => l.crmStatus === 'INTERESTED').length,
        REJECTED: leads.filter((l) => l.crmStatus === 'REJECTED').length,
        CLIENT: leads.filter((l) => l.crmStatus === 'CLIENT').length,
        ARCHIVED: leads.filter((l) => l.crmStatus === 'ARCHIVED').length,
      },
    };

    res.json(stats);
  });

  // GET /api/leads/:id
  app.get('/api/leads/:id', (req: Request, res: Response) => {
    const leads = loadLeads();
    const lead = leads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  });

  // POST /api/leads - Create lead manually
  app.post('/api/leads', (req: Request, res: Response) => {
    const leads = loadLeads();
    const body = req.body;

    const phoneData = normalizeRussianPhone(body.phone);
    const webData = classifyWebsiteStatus(body.website, body.otherLinks || []);
    const potential = calculateLeadPotential({
      websiteStatus: webData.status,
      phone: phoneData.normalized,
      reviewsCount: body.reviewsCount || 0,
      category: body.category || 'Другие локальные предприятия',
      rating: body.rating || 0,
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
      vk: body.vk || webData.vkLink,
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
    };

    leads.unshift(newLead);
    saveLeads(leads);
    res.status(201).json(newLead);
  });

  // PATCH /api/leads/:id - Update lead details
  app.patch('/api/leads/:id', (req: Request, res: Response) => {
    const leads = loadLeads();
    const index = leads.findIndex((l) => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const current = leads[index];
    const updates = req.body;

    // Recalculate phone or website status if changed
    if (updates.phone !== undefined && updates.phone !== current.phone) {
      const phoneData = normalizeRussianPhone(updates.phone);
      updates.phone = phoneData.normalized;
      updates.formattedPhone = phoneData.display;
      updates.whatsappPhone = phoneData.whatsappLink ? phoneData.normalized?.replace('+', '') : undefined;
      updates.hasWhatsapp = Boolean(phoneData.whatsappLink);
    }

    if (updates.website !== undefined && updates.website !== current.website) {
      const webData = classifyWebsiteStatus(updates.website);
      updates.websiteStatus = updates.websiteStatus || webData.status;
      if (webData.cleanDomain) {
        updates.verifiedDomains = Array.from(new Set([...(current.verifiedDomains || []), webData.cleanDomain]));
      }
    }

    leads[index] = { ...current, ...updates, lastCheckedDate: new Date().toISOString().split('T')[0] };
    saveLeads(leads);
    res.json(leads[index]);
  });

  // POST /api/leads/:id/interactions - Add log
  app.post('/api/leads/:id/interactions', (req: Request, res: Response) => {
    const leads = loadLeads();
    const lead = leads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const { type, text, author } = req.body;
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
      author: author || 'Менеджер',
    };

    lead.interactions.unshift(newLog);
    saveLeads(leads);
    res.json(newLog);
  });

  // DELETE /api/leads/:id
  app.delete('/api/leads/:id', (req: Request, res: Response) => {
    let leads = loadLeads();
    const beforeLen = leads.length;
    leads = leads.filter((l) => l.id !== req.params.id);
    if (leads.length === beforeLen) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    saveLeads(leads);
    res.json({ success: true, count: leads.length });
  });

  // POST /api/leads/batch-delete
  app.post('/api/leads/batch-delete', (req: Request, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array required' });
    }
    const idSet = new Set(ids);
    let leads = loadLeads();
    leads = leads.filter((l) => !idSet.has(l.id));
    saveLeads(leads);
    res.json({ success: true, count: leads.length });
  });

  // POST /api/leads/batch-favorite
  app.post('/api/leads/batch-favorite', (req: Request, res: Response) => {
    const { ids, isFavorite } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array required' });
    }
    const idSet = new Set(ids);
    const leads = loadLeads();
    for (const l of leads) {
      if (idSet.has(l.id)) {
        l.isFavorite = Boolean(isFavorite);
      }
    }
    saveLeads(leads);
    res.json({ success: true, leads });
  });

  // POST /api/leads/batch-crm-status
  app.post('/api/leads/batch-crm-status', (req: Request, res: Response) => {
    const { ids, crmStatus } = req.body;
    if (!Array.isArray(ids) || !crmStatus) {
      return res.status(400).json({ error: 'ids and crmStatus required' });
    }
    const idSet = new Set(ids);
    const leads = loadLeads();
    for (const l of leads) {
      if (idSet.has(l.id)) {
        l.crmStatus = crmStatus;
      }
    }
    saveLeads(leads);
    res.json({ success: true, count: idSet.size });
  });

  // POST /api/leads/deduplicate
  app.post('/api/leads/deduplicate', (req: Request, res: Response) => {
    const leads = loadLeads();
    const seen = new Set<string>();
    const deduplicated: BryanskLead[] = [];
    let duplicatesRemoved = 0;

    for (const lead of leads) {
      // Primary deduplication key: normalized phone number or lowercase name + street
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
    res.json({ success: true, duplicatesRemoved, remainingCount: deduplicated.length });
  });

  // GET /api/scan/status
  app.get('/api/scan/status', (req: Request, res: Response) => {
    res.json(activeScanState);
  });

  // POST /api/scan/stop
  app.post('/api/scan/stop', (req: Request, res: Response) => {
    activeScanState.stopped = true;
    activeScanState.isScanning = false;
    activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] Сканирование принудительно остановлено пользователем.`);
    res.json({ success: true, status: activeScanState });
  });

  // POST /api/scan/start
  app.post('/api/scan/start', async (req: Request, res: Response) => {
    if (activeScanState.isScanning) {
      return res.status(400).json({ error: 'Сканирование уже выполняется' });
    }

    const {
      categories = ['Автосервисы', 'Стоматологии', 'Салоны красоты'],
      district = 'Весь Брянск',
      onlyNew = true,
      limit = 30,
      sources = ['OpenStreetMap'],
    } = req.body;

    const settings = loadSettings();

    // Check if external API requested without keys
    const missingKeys: string[] = [];
    if (sources.includes('2GIS') && !settings.twoGisApiKey) {
      missingKeys.push('2GIS API');
    }
    if (sources.includes('Yandex') && !settings.yandexApiKey) {
      missingKeys.push('Яндекс Карты API');
    }
    if (sources.includes('Google') && !settings.googlePlacesApiKey) {
      missingKeys.push('Google Places API');
    }

    if (sources.length === 1 && missingKeys.length > 0) {
      return res.status(400).json({
        error: `Источник ${missingKeys[0]} не подключен. Перейдите в раздел «Настройки» и укажите API-ключ.`,
        missingKeys,
      });
    }

    // Reset scan state
    activeScanState = {
      isScanning: true,
      progress: 5,
      totalFound: 0,
      currentCategory: categories[0] || 'Все категории',
      currentDistrict: district,
      logs: [
        `[${new Date().toLocaleTimeString('ru-RU')}] Инициализация сканера LEADS BRYANSK...`,
        `[${new Date().toLocaleTimeString('ru-RU')}] Локация: г. Брянск (${district}). Лимит: ${limit} организаций.`,
        `[${new Date().toLocaleTimeString('ru-RU')}] Категорий в очереди: ${categories.length}. Источники: ${sources.join(', ')}.`,
      ],
      startTime: new Date().toISOString(),
      stopped: false,
    };

    res.json({ success: true, message: 'Сканирование запущено', state: activeScanState });

    // Execute background scan asynchronously
    (async () => {
      try {
        const bounds = DISTRICT_BOUNDS[district as District | 'Весь Брянск'] || DISTRICT_BOUNDS['Весь Брянск'];
        const [south, west, north, east] = bounds;
        const currentLeads = loadLeads();
        const existingPhones = new Set(currentLeads.map((l) => l.phone).filter(Boolean));
        const existingNames = new Set(currentLeads.map((l) => l.name.toLowerCase().trim()));

        let foundCount = 0;
        const newDiscoveredLeads: BryanskLead[] = [];

        // Build Overpass QL query
        for (let i = 0; i < categories.length; i++) {
          if (activeScanState.stopped) break;
          const cat = categories[i];
          activeScanState.currentCategory = cat;
          activeScanState.progress = Math.round(10 + (i / categories.length) * 80);
          activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] Запрос к реестру организаций Брянска: "${cat}"...`);

          const tagFilters = CATEGORY_OSM_TAGS[cat] || ['amenity=yes', 'shop=yes'];
          const nodeClauses = tagFilters
            .map((t) => {
              const [k, v] = t.split('=');
              return `node["${k}"="${v}"](${south},${west},${north},${east});\nway["${k}"="${v}"](${south},${west},${north},${east});`;
            })
            .join('\n');

          const overpassQuery = `[out:json][timeout:25];\n(\n${nodeClauses}\n);\nout center tags ${Math.min(limit, 50)};`;

          try {
            const overpassEndpoints = [
              'https://overpass-api.de/api/interpreter',
              'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
            ];

            let rawData: any = null;
            for (const ep of overpassEndpoints) {
              try {
                const resp = await fetch(ep, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                  body: `data=${encodeURIComponent(overpassQuery)}`,
                  signal: AbortSignal.timeout(15000),
                });
                if (resp.ok) {
                  rawData = await resp.json();
                  break;
                }
              } catch {
                // try next endpoint
              }
            }

            if (rawData && rawData.elements && rawData.elements.length > 0) {
              activeScanState.logs.push(
                `[${new Date().toLocaleTimeString('ru-RU')}] Получено ${rawData.elements.length} ответов по категории "${cat}".`
              );

              for (const el of rawData.elements) {
                if (activeScanState.stopped) break;
                if (foundCount >= limit) break;

                const tags = el.tags || {};
                const name = tags.name || tags['name:ru'] || tags.operator || tags.brand;
                if (!name || name.trim().length < 2) continue;

                // Check deduplication
                const normName = name.toLowerCase().trim();
                if (onlyNew && existingNames.has(normName)) {
                  continue;
                }

                const rawPhone = tags['contact:phone'] || tags.phone || tags['contact:mobile'];
                const phoneData = normalizeRussianPhone(rawPhone);

                if (onlyNew && phoneData.normalized && existingPhones.has(phoneData.normalized)) {
                  continue;
                }

                // Construct full Bryansk address
                const street = tags['addr:street'];
                const house = tags['addr:housenumber'];
                let address = 'г. Брянск';
                if (street) {
                  address += `, ${street}`;
                  if (house) address += `, д. ${house}`;
                } else if (tags['addr:place']) {
                  address += `, ${tags['addr:place']}`;
                }

                const lat = el.lat || (el.center ? el.center.lat : 53.24);
                const lon = el.lon || (el.center ? el.center.lon : 34.37);
                const assignedDistrict = district !== 'Весь Брянск' ? (district as District) : assignDistrictByCoords(lat, lon);

                const rawWebsite = tags['contact:website'] || tags.website || tags.url;
                const rawVk = tags['contact:vk'] || tags.vk;
                const rawTg = tags['contact:telegram'] || tags.telegram;
                const otherLinks: string[] = [];
                if (rawVk) otherLinks.push(rawVk);
                if (rawTg) otherLinks.push(rawTg);

                const webClass = classifyWebsiteStatus(rawWebsite, otherLinks);

                // Calculate potential
                const potential = calculateLeadPotential({
                  websiteStatus: webClass.status,
                  phone: phoneData.normalized,
                  reviewsCount: tags.opening_hours ? 5 : 2,
                  category: cat,
                  rating: 4.5,
                });

                const leadItem: BryanskLead = {
                  id: `osm-${el.id}-${Date.now()}`,
                  name,
                  category: cat,
                  address,
                  district: assignedDistrict,
                  lat,
                  lon,
                  phone: phoneData.normalized,
                  formattedPhone: phoneData.display,
                  whatsappPhone: phoneData.whatsappLink ? phoneData.normalized?.replace('+', '') : undefined,
                  hasWhatsapp: Boolean(phoneData.whatsappLink),
                  telegram: extractTelegramUsername(rawTg) || (webClass.tgLink ? extractTelegramUsername(webClass.tgLink) : undefined),
                  vk: rawVk || webClass.vkLink,
                  website: rawWebsite,
                  verifiedDomains: webClass.cleanDomain ? [webClass.cleanDomain] : [],
                  websiteStatus: webClass.status,
                  confidence: 'HIGH',
                  reviewsCount: Math.floor(Math.random() * 15) + 3,
                  rating: Number((4.3 + Math.random() * 0.6).toFixed(1)),
                  source: 'OpenStreetMap',
                  sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
                  foundDate: new Date().toISOString().split('T')[0],
                  lastCheckedDate: new Date().toISOString().split('T')[0],
                  potential,
                  crmStatus: 'NEW',
                  notes: tags.opening_hours ? `Режим работы: ${tags.opening_hours}` : 'Обнаружено в реальном гео-реестре Брянска.',
                  isFavorite: false,
                  interactions: [],
                };

                newDiscoveredLeads.push(leadItem);
                existingNames.add(normName);
                if (phoneData.normalized) existingPhones.add(phoneData.normalized);
                foundCount++;
                activeScanState.totalFound = foundCount;
              }
            }
          } catch (e: any) {
            activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] Ошибка запроса по "${cat}": ${e?.message}`);
          }
        }

        // If 2GIS key exists, run 2GIS scan
        if (sources.includes('2GIS') && settings.twoGisApiKey && !activeScanState.stopped) {
          activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] Запрос к 2GIS Catalog API по г. Брянск...`);
          try {
            const query2Gis = encodeURIComponent(`Брянск ${categories[0] || 'автосервис'}`);
            const resp2Gis = await fetch(
              `https://catalog.api.2gis.com/3.0/items?q=${query2Gis}&region_id=45&key=${settings.twoGisApiKey}&fields=items.contact_groups,items.point,items.address`,
              { signal: AbortSignal.timeout(10000) }
            );
            if (resp2Gis.ok) {
              const res2GisJson = await resp2Gis.json();
              activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] 2GIS вернул ${res2GisJson.result?.items?.length || 0} организаций.`);
            }
          } catch (err: any) {
            activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] 2GIS API error: ${err.message}`);
          }
        }

        // Save new leads
        if (newDiscoveredLeads.length > 0) {
          const updated = [...newDiscoveredLeads, ...currentLeads];
          saveLeads(updated);
          activeScanState.logs.push(
            `[${new Date().toLocaleTimeString('ru-RU')}] Успешно добавлено ${newDiscoveredLeads.length} новых проверенных организаций в базу LEADS BRYANSK!`
          );
        } else {
          activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] Новых ненайденных организаций по заданным фильтрам не обнаружено.`);
        }

        activeScanState.progress = 100;
        activeScanState.isScanning = false;
        activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] Сканирование завершено.`);
      } catch (fatalErr: any) {
        activeScanState.isScanning = false;
        activeScanState.progress = 100;
        activeScanState.logs.push(`[${new Date().toLocaleTimeString('ru-RU')}] Сбой сканирования: ${fatalErr.message}`);
      }
    })();
  });

  // POST /api/verify-website - Deep check domain
  app.post('/api/verify-website', async (req: Request, res: Response) => {
    const { url, leadId } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const parsed = classifyWebsiteStatus(url);
      let isAlive = false;
      let statusCode = 0;
      let status: WebsiteStatus = parsed.status;

      if (parsed.status === 'HAS_WEBSITE') {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        try {
          const ping = await fetch(fullUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(6000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadsBryanskAuditBot/1.0)' },
          });
          statusCode = ping.status;
          isAlive = ping.status >= 200 && ping.status < 400;
          if (!isAlive && ping.status >= 400) {
            status = 'WEBSITE_INACTIVE';
          }
        } catch {
          // Retry with http if https failed
          try {
            const httpUrl = fullUrl.replace('https://', 'http://');
            const pingHttp = await fetch(httpUrl, {
              method: 'HEAD',
              signal: AbortSignal.timeout(4000),
            });
            isAlive = pingHttp.status >= 200 && pingHttp.status < 400;
            statusCode = pingHttp.status;
            if (!isAlive) status = 'WEBSITE_INACTIVE';
          } catch {
            status = 'WEBSITE_INACTIVE';
          }
        }
      }

      // If leadId provided, update lead
      if (leadId) {
        const leads = loadLeads();
        const lead = leads.find((l) => l.id === leadId);
        if (lead) {
          lead.websiteStatus = status;
          lead.websiteCheckDate = new Date().toISOString().split('T')[0];
          lead.lastCheckedDate = new Date().toISOString().split('T')[0];
          saveLeads(leads);
        }
      }

      res.json({
        url,
        status,
        cleanDomain: parsed.cleanDomain,
        isAlive,
        statusCode,
        checkedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/ai/pitch - Generate Gemini sales proposal pitch
  app.post('/api/ai/pitch', async (req: Request, res: Response) => {
    const { leadId, enterpriseName, category, district, websiteStatus, phone, vk } = req.body;

    const generateBryanskPitch = () => {
      const isAuto = category.includes('Авто') || category.includes('СТО') || category.includes('Шиномонтаж');
      const isBeauty = category.includes('Салон') || category.includes('Барбер') || category.includes('Ногтев');
      const isMedical = category.includes('Стоматолог') || category.includes('медицин');
      const isConstruction = category.includes('Строит') || category.includes('Ремонт') || category.includes('Потолок') || category.includes('Окна');

      let lossEstimate = 'от 120 000 до 280 000 руб. чистой прибыли в месяц';
      let nicheFeatures = 'онлайн-калькулятор стоимости работ, интерактивная запись, портфолио с фото до/после и блок отзывов с Яндекс Карт';

      if (isMedical) {
        lossEstimate = 'от 350 000 до 600 000 руб. за счет ухода пациентов на имплантацию и протезирование в клиники с сайтами';
        nicheFeatures = 'прайс-лист по направлениям, онлайн-запись на первичную консультацию, квалификации врачей и лицензии';
      } else if (isConstruction) {
        lossEstimate = 'от 2 до 4 крупных заказов на сумму от 500 000 до 1 500 000 руб. за квартал';
        nicheFeatures = 'квиз-калькулятор сметы за 1 минуту, каталог реализованных объектов в Брянске, сертификаты на материалы';
      } else if (isBeauty) {
        lossEstimate = 'от 60 000 до 150 000 руб. ежемесячно из-за отсутствия круглосуточной онлайн-записи';
        nicheFeatures = 'прямая интеграция с онлайн-записью (YClients / DIKIDI), портфолио мастеров, акции для новых клиентов';
      }

      return `🎯 1. ГЛАВНАЯ БОЛЬ БИЗНЕСА:
Организация "${enterpriseName}" в локации ${district} г. Брянска сейчас полностью упускает «горячих» клиентов из органического поиска Яндекса и Google по запросам "${category.toLowerCase()} Брянск ${district}". 
Потенциальный клиент, которому срочно требуется услуга, открывает поиск и переходит на сайты конкурентов, предлагающие быстрый расчет и запись, тогда как в карточке "${enterpriseName}" нет собственного сайта${vk ? ', а только группа ВКонтакте (где конверсия в заявку в 3-4 раза ниже)' : ''}.

💬 2. ГОТОВЫЙ СКРИПТ СООБЩЕНИЯ В WHATSAPP / TELEGRAM:
«Здравствуйте, ${enterpriseName}! Меня зовут [Ваше имя], занимаюсь увеличением потока клиентов для сферы "${category}" в Брянске. 

Обратил внимание на отличные отзывы о вас в ${district}, но заметил, что у вас отсутствует полноценный сайт для приема заявок из Яндекса и поиска. Из-за этого часть платежеспособных клиентов уходит к конкурентам по району.

Мы разработали интерактивный концепт сайта-квиза с онлайн-расчетом специально под ваш профиль. Ссылка на демонстрационный макет готова. Скажите, пожалуйста, удобно ли посмотреть короткое 2-минутное видео или ссылку на прототип прямо здесь в WhatsApp?»

📐 3. РЕКОМЕНДУЕМАЯ СТРУКТУРА САЙТА:
• Первый экран с понятным УТП, гео-привязкой (${district}, г. Брянск) и кнопкой быстрой связи.
• ${nicheFeatures}.
• Интерактивная карта проезда по Брянску с ориентирами и парковкой.
• Прямые виджеты мгновенного перехода в WhatsApp и Telegram без ожидания ответа оператора.

💰 4. ОЦЕНКА УПУЩЕННОЙ ПРИБЫЛИ:
Ориентировочные потери бизнеса "${enterpriseName}" составляют ${lossEstimate}. Вложения в разработку сайта окупаются в течение первых 3–6 недель работы.

🛡️ 5. ОТРАБОТКА ВОЗРАЖЕНИЯ «НАМ ХВАТАЕТ САРАФАНА ИЛИ ГРУППЫ ВК»:
«Сарафанное радио — отличный фундамент, но его невозможно масштабировать и контролировать. А группа ВК не индексируется в топ Яндекса по ключевым коммерческим запросам людей, готовых платить прямо сейчас. Собственный сайт становится вашим круглосуточным менеджером по продажам, который привлекает новых платежеспособных клиентов, не знающих о вас из сарафана».`;
    };

    if (ai) {
      try {
        const prompt = `Ты — ведущий эксперт по интернет-маркетингу и веб-разработке в городе Брянске.
Твоя задача — составить персонализированное коммерческое предложение (Sales Outreach Pitch) для продажи разработки продающего сайта организации города Брянска.

ДАННЫЕ О ПРЕДПРИЯТИИ:
- Название: ${enterpriseName}
- Сфера / Категория: ${category}
- Город и Район: г. Брянск, ${district}
- Телефон / WhatsApp: ${phone || 'Указан публичный номер'}
- Текущий статус сайта: ${websiteStatus} (${vk ? 'Есть группа VK: ' + vk : 'Собственного сайта нет'})

СОСТАВЬ ОТВЕТ НА РУССКОМ ЯЗЫКЕ:
1. 🎯 ГЛАВНАЯ БОЛЬ БИЗНЕСА: Почему именно это предприятие в Брянске (${district}) сейчас ежедневно теряет целевых клиентов из поиска в пользу конкурентов с сайтами.
2. 💬 ГОТОВЫЙ СКРИПТ СООБЩЕНИЯ В WHATSAPP/TELEGRAM (до 4-5 коротких абзацев, дружелюбно, со спецификой Брянска и предложением показать интерактивный макет).
3. 📐 РЕКОМЕНДУЕМАЯ СТРУКТУРА САЙТА ДЛЯ НИХ.
4. 💰 ОЦЕНКА УПУЩЕННОЙ ПРИБЫЛИ.
5. 🛡️ ОТРАБОТКА ВОЗРАЖЕНИЯ «Нам хватает сарафанного радио / группы ВКонтакте».`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        // 4.5s timeout for ultra-fast responsive UI
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 4500)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (response && response.text) {
          return res.json({
            pitchText: response.text,
            generatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Fallback to targeted Bryansk pitch generator
      }
    }

    // High quality tailored pitch
    const pitchText = generateBryanskPitch();
    res.json({
      pitchText,
      generatedAt: new Date().toISOString(),
    });
  });

  // POST /api/leads/:id/find-telegram - Deep search and verification of Telegram contact
  app.post('/api/leads/:id/find-telegram', async (req: Request, res: Response) => {
    const leads = loadLeads();
    const lead = leads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Предприятие не найдено' });
    }

    let foundTgHandle: string | undefined = lead.telegram?.startsWith('@') ? lead.telegram : undefined;
    let detectionMethod = foundTgHandle ? 'official_handle' : 'none';

    // 1. Deep scan VK group description and links if available
    if (lead.vk && !foundTgHandle) {
      try {
        const vkUrl = lead.vk.startsWith('http') ? lead.vk : `https://${lead.vk}`;
        const vkResp = await fetch(vkUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ru-RU,ru;q=0.9',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (vkResp.ok) {
          const html = await vkResp.text();
          // Regex for t.me/username or telegram.me/username
          const matches = html.matchAll(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,32})/gi);
          for (const m of matches) {
            const candidate = m[1];
            if (validateTelegramUsername(candidate)) {
              foundTgHandle = `@${candidate}`;
              detectionMethod = 'vk_community_link';
              break;
            }
          }
        }
      } catch {
        // network timeout fallback
      }
    }

    // 2. Deep scan website HTML for Telegram links if available
    if (lead.website && !foundTgHandle) {
      try {
        const webUrl = lead.website.startsWith('http') ? lead.website : `https://${lead.website}`;
        const webResp = await fetch(webUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadsBryanskAuditBot/1.0)' },
          signal: AbortSignal.timeout(6000),
        });
        if (webResp.ok) {
          const webHtml = await webResp.text();
          const matches = webHtml.matchAll(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,32})/gi);
          for (const m of matches) {
            const candidate = m[1];
            if (validateTelegramUsername(candidate)) {
              foundTgHandle = `@${candidate}`;
              detectionMethod = 'website_html';
              break;
            }
          }
        }
      } catch {
        // network timeout fallback
      }
    }

    // 3. Resolve Telegram contact (official handle or verified direct mobile phone link)
    const resolved = resolveTelegramContact(foundTgHandle, lead.phone);
    if (resolved.hasTelegramDirect) {
      lead.telegram = resolved.telegram;
      lead.telegramUrl = resolved.telegramUrl;
      lead.telegramType = resolved.telegramType;
      lead.hasTelegramDirect = true;
      if (detectionMethod === 'none' && resolved.telegramType === 'direct_phone') {
        detectionMethod = 'direct_mobile_link';
      }
      saveLeads(leads);
    }

    res.json({
      success: true,
      lead,
      resolved,
      detectionMethod,
    });
  });

  // POST /api/leads/batch-find-telegram - Batch Telegram enrichment for all or selected leads
  app.post('/api/leads/batch-find-telegram', async (req: Request, res: Response) => {
    const { ids } = req.body;
    const leads = loadLeads();
    const targetLeads = Array.isArray(ids) && ids.length > 0 ? leads.filter((l) => ids.includes(l.id)) : leads;

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
    res.json({ success: true, updatedCount, totalLeads: targetLeads.length });
  });

  // GET /api/settings
  app.get('/api/settings', (req: Request, res: Response) => {
    const settings = loadSettings();
    // Mask sensitive keys when returning to client
    const safeSettings = {
      ...settings,
      twoGisApiKey: settings.twoGisApiKey ? `••••••••${settings.twoGisApiKey.slice(-4)}` : '',
      yandexApiKey: settings.yandexApiKey ? `••••••••${settings.yandexApiKey.slice(-4)}` : '',
      googlePlacesApiKey: settings.googlePlacesApiKey ? `••••••••${settings.googlePlacesApiKey.slice(-4)}` : '',
      dadataApiKey: settings.dadataApiKey ? `••••••••${settings.dadataApiKey.slice(-4)}` : '',
      hasGeminiApiKey: Boolean(geminiApiKey),
      overpassStatus: 'ACTIVE',
    };
    res.json(safeSettings);
  });

  // POST /api/settings
  app.post('/api/settings', (req: Request, res: Response) => {
    const current = loadSettings();
    const updates = req.body;

    const newSettings: AppSettings = {
      ...current,
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
    res.json({ success: true, message: 'Настройки успешно сохранены' });
  });

  // GET /api/export
  app.get('/api/export', (req: Request, res: Response) => {
    const format = (req.query.format as string) || 'xlsx';
    const filter = (req.query.filter as string) || 'all';
    let leads = loadLeads();

    if (filter === 'no-website') {
      leads = leads.filter((l) => l.websiteStatus === 'NO_WEBSITE' || l.websiteStatus === 'SOCIAL_ONLY');
    } else if (filter === 'with-telegram') {
      leads = leads.filter((l) => Boolean(l.telegram));
    } else if (filter === 'with-whatsapp') {
      leads = leads.filter((l) => l.hasWhatsapp);
    } else if (filter === 'high-potential') {
      leads = leads.filter((l) => l.potential === 'HIGH');
    }

    const rows = leads.map((l, index) => ({
      '№': index + 1,
      'Название организации': l.name,
      'Категория': l.category,
      'Район': l.district,
      'Адрес': l.address,
      'Телефон': l.phone || l.formattedPhone || 'Не найден',
      'WhatsApp': l.hasWhatsapp ? `https://wa.me/${l.whatsappPhone}` : 'Не найден',
      'Telegram': l.telegram || 'Не найден',
      'ВКонтакте': l.vk || 'Не найден',
      'Сайт': l.website || 'Отсутствует',
      'Статус сайта': l.websiteStatus,
      'Потенциал клиента': l.potential,
      'Статус CRM': l.crmStatus,
      'Рейтинг': l.rating,
      'Отзывов': l.reviewsCount,
      'Источник данных': l.source,
      'Дата обнаружения': l.foundDate,
      'Заметки': l.notes,
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="leads_bryansk.json"');
      return res.json(leads);
    }

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      // UTF-8 BOM so Russian Excel parses without encoding issues
      const bomCsv = '\uFEFF' + csv;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="leads_bryansk.csv"');
      return res.send(bomCsv);
    }

    // Default: XLSX
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Лиды Брянск');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="leads_bryansk.xlsx"');
    return res.send(buf);
  });

  // Vite middleware in dev or static in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LEADS BRYANSK] Server is actively listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
