/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { activeScanState, loadLeads, saveLeads, loadSettings } from '@/lib/db';
import {
  normalizeRussianPhone,
  classifyWebsiteStatus,
  calculateLeadPotential,
  extractTelegramUsername,
  cleanVkUrl,
  calculateLostProfitAudit,
} from '@/lib/leadLogic';
import { BryanskLead, District } from '@/lib/types';

const BRYANSK_DISTRICT_BOUNDS: Record<string, [number, number, number, number]> = {
  'Весь Брянск': [53.16, 34.24, 53.38, 34.52],
  'Советский район': [53.22, 34.32, 53.28, 34.42],
  'Бежицкий район': [53.27, 34.26, 53.38, 34.38],
  'Володарский район': [53.24, 34.40, 53.30, 34.52],
  'Фокинский район': [53.16, 34.36, 53.24, 34.46],
};

// 100+ Pre-mapped Russian cities coordinates: [south, west, north, east]
const KNOWN_CITY_BOUNDS: Record<string, [number, number, number, number]> = {
  // Брянская область
  'брянск': [53.16, 34.24, 53.38, 34.52],
  'клинцы': [52.74, 32.20, 52.79, 32.28],
  'новозыбков': [52.52, 31.90, 52.57, 31.98],
  'дятьково': [53.58, 34.31, 53.63, 34.38],
  'унеча': [52.83, 32.65, 52.87, 32.72],
  'карачев': [53.11, 34.95, 53.15, 35.03],
  'стародуб': [52.57, 32.74, 52.61, 32.81],
  'жуковка': [53.51, 33.70, 53.55, 33.76],
  'сельцо': [53.35, 34.09, 53.39, 34.15],
  'почеп': [52.91, 33.42, 52.95, 33.49],
  'трубчевск': [52.56, 33.74, 52.60, 33.80],

  // Центральный федеральный округ (ЦФО)
  'москва': [55.55, 37.35, 55.92, 37.85],
  'орел': [52.90, 35.98, 53.05, 36.18],
  'смоленск': [54.74, 31.97, 54.83, 32.12],
  'курск': [51.66, 36.11, 51.78, 36.26],
  'калуга': [54.49, 36.18, 54.58, 36.32],
  'воронеж': [51.60, 39.12, 51.75, 39.30],
  'тула': [54.14, 37.55, 54.24, 37.68],
  'липецк': [52.56, 39.52, 52.66, 39.68],
  'белгород': [50.56, 36.52, 50.65, 36.66],
  'рязань': [54.58, 39.65, 54.68, 39.82],
  'тверь': [56.81, 35.82, 56.91, 35.98],
  'ярославль': [57.58, 39.80, 57.68, 39.95],
  'владимир': [56.09, 40.32, 56.18, 40.48],
  'иваново': [56.95, 40.92, 57.05, 41.06],
  'кострома': [57.73, 40.88, 57.81, 41.02],
  'тамбов': [52.68, 41.40, 52.76, 41.50],
  'старый оскол': [51.27, 37.80, 51.35, 37.92],
  'рыбинск': [58.02, 38.78, 58.08, 38.88],

  // Северо-Запад (СЗФО)
  'санкт-петербург': [59.80, 30.15, 60.08, 30.50],
  'питер': [59.80, 30.15, 60.08, 30.50],
  'спб': [59.80, 30.15, 60.08, 30.50],
  'калининград': [54.68, 20.45, 54.76, 20.58],
  'архангельск': [64.51, 40.50, 64.58, 40.62],
  'мурманск': [68.94, 33.05, 69.01, 33.15],
  'вологда': [59.20, 39.85, 59.26, 39.95],
  'череповец': [59.10, 37.88, 59.17, 37.98],
  'петрозаводск': [61.76, 34.32, 61.82, 34.42],
  'великий новгород': [58.50, 31.24, 58.56, 31.32],
  'псков': [57.79, 28.30, 57.85, 28.38],
  'северодвинск': [64.53, 39.78, 64.60, 39.90],
  'сыктывкар': [61.64, 50.78, 61.70, 50.88],

  // Поволжье (ПФО)
  'нижний новгород': [56.22, 43.85, 56.36, 44.08],
  'казань': [55.72, 49.04, 55.86, 49.25],
  'самара': [53.15, 50.10, 53.28, 50.28],
  'уфа': [54.69, 55.90, 54.81, 56.08],
  'пермь': [57.96, 56.15, 58.07, 56.32],
  'саратов': [51.50, 45.92, 51.60, 46.08],
  'тольятти': [53.48, 49.25, 53.58, 49.45],
  'ижевск': [56.81, 53.15, 56.92, 53.30],
  'ульяновск': [54.28, 48.30, 54.38, 48.45],
  'пенза': [53.16, 44.95, 53.25, 45.08],
  'чебоксары': [56.10, 47.20, 56.18, 47.32],
  'киров': [58.56, 49.58, 58.64, 49.72],
  'набережные челны': [55.70, 52.32, 55.78, 52.45],
  'дзержинск': [56.22, 43.40, 56.26, 43.50],
  'йошкар-ола': [56.61, 47.85, 56.66, 47.93],
  'саранск': [54.17, 45.15, 54.22, 45.24],
  'сызрань': [53.13, 48.42, 53.19, 48.52],

  // Юг и Кавказ (ЮФО, СКФО, Крым)
  'ростов-на-дону': [47.20, 39.65, 47.30, 39.80],
  'ростов': [47.20, 39.65, 47.30, 39.80],
  'краснодар': [45.00, 38.92, 45.10, 39.05],
  'сочи': [43.54, 39.68, 43.64, 39.78],
  'волгоград': [48.65, 44.45, 48.78, 44.58],
  'астрахань': [46.31, 47.98, 46.40, 48.10],
  'ставрополь': [45.01, 41.92, 45.08, 42.02],
  'новороссийск': [44.68, 37.72, 44.75, 37.82],
  'таганрог': [47.20, 38.86, 47.27, 38.96],
  'армавир': [44.98, 41.08, 45.03, 41.15],
  'анапа': [44.87, 37.30, 44.92, 37.35],
  'геленджик': [44.54, 38.05, 44.58, 38.10],
  'шахты': [47.69, 40.18, 47.74, 40.26],
  'волжский': [48.78, 44.74, 48.83, 44.82],
  'махачкала': [42.94, 47.45, 43.02, 47.55],
  'владикавказ': [42.99, 44.64, 43.06, 44.71],
  'грозный': [43.29, 45.65, 43.34, 45.72],
  'нальчик': [43.46, 43.58, 43.52, 43.65],
  'севастополь': [44.56, 33.48, 44.64, 33.58],
  'симферополь': [44.92, 34.06, 44.99, 34.15],

  // Урал (УрФО)
  'екатеринбург': [56.78, 60.52, 56.90, 60.70],
  'челябинск': [55.12, 61.32, 55.22, 61.48],
  'тюмень': [57.12, 65.48, 57.20, 65.60],
  'магнитогорск': [53.38, 58.95, 53.46, 59.08],
  'курган': [55.42, 65.30, 55.48, 65.40],
  'сургут': [61.22, 73.35, 61.29, 73.48],
  'нижневартовск': [60.91, 76.50, 60.98, 76.62],
  'нижний тагил': [57.89, 59.94, 57.95, 60.03],
  'златоуст': [55.15, 59.63, 55.20, 59.70],
  'миасс': [54.98, 60.08, 55.04, 60.14],

  // Сибирь и Дальний Восток (СФО, ДВФО)
  'новосибирск': [54.98, 82.88, 55.10, 83.05],
  'омск': [54.95, 73.30, 55.05, 73.45],
  'красноярск': [55.98, 92.80, 56.08, 93.00],
  'барнаул': [53.32, 83.70, 53.40, 83.82],
  'иркутск': [52.25, 104.22, 52.34, 104.35],
  'томск': [56.45, 84.92, 56.54, 85.05],
  'кемерово': [55.32, 86.02, 55.40, 86.15],
  'новокузнецк': [53.72, 87.10, 53.80, 87.22],
  'хабаровск': [48.45, 135.02, 48.55, 135.15],
  'владивосток': [43.10, 131.88, 43.18, 131.96],
  'улан-удэ': [51.81, 107.56, 51.87, 107.65],
  'чита': [52.01, 113.46, 52.07, 113.54],
  'якутск': [62.00, 129.69, 62.06, 129.77],
  'благовещенск': [50.25, 127.50, 50.30, 127.56],
  'комсомольск-на-амуре': [50.52, 137.00, 50.58, 137.06],
  'петропавловск-камчатский': [53.00, 158.60, 53.07, 158.70],
  'южно-сахалинск': [46.94, 142.71, 47.00, 142.77],
  'норильск': [69.32, 88.16, 69.36, 88.24],
};

function cleanCityName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^г\.?\s*/i, '')
    .replace(/^город\s+/i, '')
    .replace(/\s+город$/i, '')
    .trim();
}

async function getCityBoundingBox(cityName: string, district?: string): Promise<{
  bounds: [number, number, number, number];
  source: string;
}> {
  const normCity = cleanCityName(cityName);

  if (normCity === 'брянск') {
    if (district && BRYANSK_DISTRICT_BOUNDS[district]) {
      return { bounds: BRYANSK_DISTRICT_BOUNDS[district], source: 'Predefined Bryansk District' };
    }
    return { bounds: BRYANSK_DISTRICT_BOUNDS['Весь Брянск'], source: 'Predefined Bryansk' };
  }

  // 1. Direct dictionary match
  if (KNOWN_CITY_BOUNDS[normCity]) {
    return { bounds: KNOWN_CITY_BOUNDS[normCity], source: 'Known Russian City Coordinates' };
  }

  // 2. Multi-source dynamic geocoding for any custom city/town
  const geocodeAttempts = [
    // Attempt 1: Nominatim with structured query
    `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(normCity)}&country=Russia&format=json&limit=1`,
    // Attempt 2: Nominatim with full query
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normCity + ', Россия')}&format=json&limit=1`,
    // Attempt 3: Photon geocoder
    `https://photon.komoot.io/api/?q=${encodeURIComponent(normCity + ' Russia')}&limit=1`,
  ];

  for (const url of geocodeAttempts) {
    try {
      const isPhoton = url.includes('photon');
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FormStudioLeadFinder/2.0 (lead-audit-bot)' },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (isPhoton) {
          if (data && data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates; // [lon, lat]
            const lon = coords[0];
            const lat = coords[1];
            return {
              bounds: [lat - 0.08, lon - 0.12, lat + 0.08, lon + 0.12],
              source: `Photon Dynamic Geocoder (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
            };
          }
        } else {
          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            if (item.boundingbox) {
              const [southStr, northStr, westStr, eastStr] = item.boundingbox;
              return {
                bounds: [Number(southStr), Number(westStr), Number(northStr), Number(eastStr)],
                source: `Nominatim Geocoder (${item.display_name})`,
              };
            }
            if (item.lat && item.lon) {
              const lat = Number(item.lat);
              const lon = Number(item.lon);
              return {
                bounds: [lat - 0.08, lon - 0.12, lat + 0.08, lon + 0.12],
                source: `Nominatim Center Point (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Geocoding URL failed: ${url}`, err);
    }
  }

  throw new Error(
    `Не удалось определить точные географические координаты для «${cityName}». Пожалуйста, проверьте написание названия города или выберите один из доступных городов РФ.`
  );
}

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

export async function POST(req: NextRequest) {
  if (activeScanState.isScanning) {
    return NextResponse.json({ error: 'Сканирование уже выполняется' }, { status: 400 });
  }

  const {
    city = 'Брянск',
    categories = ['Автосервисы', 'Стоматологии', 'Салоны красоты'],
    district = 'Весь город',
    onlyNew = true,
    limit = 30,
    sources = ['OpenStreetMap'],
  } = await req.json();

  const settings = loadSettings();

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
    return NextResponse.json(
      {
        error: `Источник ${missingKeys[0]} не подключен. Перейдите в раздел «Настройки» и укажите API-ключ.`,
        missingKeys,
      },
      { status: 400 }
    );
  }

  const targetCity = (city || 'Брянск').trim();
  const scanSessionId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Reset scan state
  activeScanState.isScanning = true;
  activeScanState.progress = 5;
  activeScanState.totalFound = 0;
  activeScanState.currentCategory = categories[0] || 'Все категории';
  activeScanState.currentDistrict = district;
  activeScanState.currentCity = targetCity;
  (activeScanState as any).scanSessionId = scanSessionId;

  const addLog = (msg: string) => {
    if ((activeScanState as any).scanSessionId !== scanSessionId) return;
    activeScanState.logs.push(msg);
    if (activeScanState.logs.length > 80) {
      activeScanState.logs = activeScanState.logs.slice(-80);
    }
  };

  activeScanState.logs = [
    `[${new Date().toLocaleTimeString('ru-RU')}] Инициализация сканера FORM STUDIO...`,
    `[${new Date().toLocaleTimeString('ru-RU')}] Локация: г. ${targetCity} (${district}). Лимит: ${limit} организаций.`,
    `[${new Date().toLocaleTimeString('ru-RU')}] Категорий в очереди: ${categories.length}. Источники: ${sources.join(', ')}.`,
  ];
  activeScanState.startTime = new Date().toISOString();
  activeScanState.stopped = false;

  // Run async scan in background
  (async () => {
    try {
      const { bounds, source } = await getCityBoundingBox(targetCity, district);
      if ((activeScanState as any).scanSessionId !== scanSessionId) return;
      const [south, west, north, east] = bounds;
      const centerLat = (south + north) / 2;
      const centerLon = (west + east) / 2;

      addLog(
        `[${new Date().toLocaleTimeString('ru-RU')}] Гео-координаты г. ${targetCity} (${source}): [${south.toFixed(2)}, ${west.toFixed(2)} — ${north.toFixed(2)}, ${east.toFixed(2)}]`
      );

      const currentLeads = loadLeads();
      const existingPhones = new Set(currentLeads.map((l) => l.phone).filter(Boolean));
      const existingNames = new Set(currentLeads.map((l) => l.name.toLowerCase().trim()));
      let foundCount = 0;
      const newDiscoveredLeads: BryanskLead[] = [];

      for (let i = 0; i < categories.length; i++) {
        if (activeScanState.stopped || (activeScanState as any).scanSessionId !== scanSessionId) break;
        const cat = categories[i];
        activeScanState.currentCategory = cat;
        activeScanState.progress = Math.round(10 + (i / categories.length) * 80);
        addLog(`[${new Date().toLocaleTimeString('ru-RU')}] Поиск организаций в г. ${targetCity}: "${cat}"...`);

        const tagFilters = CATEGORY_OSM_TAGS[cat] || ['amenity=yes', 'shop=yes'];
        const nodeClauses = tagFilters
          .map((t) => {
            const [k, v] = t.split('=');
            return `node["${k}"="${v}"](${south},${west},${north},${east});\nway["${k}"="${v}"](${south},${west},${north},${east});`;
          })
          .join('\n');

        const overpassQuery = `[out:json][timeout:25];\n(\n${nodeClauses}\n);\nout center tags ${Math.min(limit, 50)};`;

        // Secondary query by radius around center in case bounding box is too large or congested
        const radiusClauses = tagFilters
          .map((t) => {
            const [k, v] = t.split('=');
            return `node["${k}"="${v}"](around:15000,${centerLat},${centerLon});\nway["${k}"="${v}"](around:15000,${centerLat},${centerLon});`;
          })
          .join('\n');
        const radiusQuery = `[out:json][timeout:20];\n(\n${radiusClauses}\n);\nout center tags ${Math.min(limit, 50)};`;

        try {
          const overpassEndpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://lz4.overpass-api.de/api/interpreter',
            'https://z.overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter',
            'https://overpass.private.coffee/api/interpreter',
          ];
          let rawData: any = null;

          // Try endpoints with primary bounding-box query
          for (const ep of overpassEndpoints) {
            try {
              const resp = await fetch(ep, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: `data=${encodeURIComponent(overpassQuery)}`,
                signal: AbortSignal.timeout(10000),
              });
              if (resp.ok) {
                rawData = await resp.json();
                if (rawData?.elements) break;
              }
            } catch {
              // try next mirror
            }
          }

          // If primary failed, try radius around city center
          if (!rawData || !rawData.elements) {
            for (const ep of overpassEndpoints.slice(0, 3)) {
              try {
                const resp = await fetch(ep, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                  body: `data=${encodeURIComponent(radiusQuery)}`,
                  signal: AbortSignal.timeout(10000),
                });
                if (resp.ok) {
                  rawData = await resp.json();
                  if (rawData?.elements) break;
                }
              } catch {
                // try next
              }
            }
          }

          if (rawData && rawData.elements && rawData.elements.length > 0) {
            addLog(
              `[${new Date().toLocaleTimeString('ru-RU')}] Получено ${rawData.elements.length} предприятий в г. ${targetCity} («${cat}»).`
            );

            for (const el of rawData.elements) {
              if (activeScanState.stopped || (activeScanState as any).scanSessionId !== scanSessionId) break;
              if (foundCount >= limit) break;

              const tags = el.tags || {};
              const name = tags.name || tags['name:ru'] || tags.operator || tags.brand;
              if (!name || name.trim().length < 2) continue;

              const normName = name.toLowerCase().trim();
              if (onlyNew && existingNames.has(normName)) {
                continue;
              }

              const rawPhone = tags['contact:phone'] || tags.phone || tags['contact:mobile'];
              const phoneData = normalizeRussianPhone(rawPhone);
              if (onlyNew && phoneData.normalized && existingPhones.has(phoneData.normalized)) {
                continue;
              }

              const street = tags['addr:street'];
              const house = tags['addr:housenumber'];
              let address = `г. ${targetCity}`;
              if (street) {
                address += `, ${street}`;
                if (house) address += `, д. ${house}`;
              } else if (tags['addr:place']) {
                address += `, ${tags['addr:place']}`;
              }

              const lat = el.lat || (el.center ? el.center.lat : (south + north) / 2);
              const lon = el.lon || (el.center ? el.center.lon : (west + east) / 2);
              const assignedDistrict = district !== 'Весь город' && district !== 'Весь Брянск' ? district : `${targetCity} (Центр / Район)`;

              const rawWebsite = tags['contact:website'] || tags.website || tags.url;
              const rawVk = tags['contact:vk'] || tags.vk;
              const rawTg = tags['contact:telegram'] || tags.telegram;
              const otherLinks: string[] = [];
              if (rawVk) otherLinks.push(rawVk);
              if (rawTg) otherLinks.push(rawTg);

              const webClass = classifyWebsiteStatus(rawWebsite, otherLinks);
              const potential = calculateLeadPotential({
                websiteStatus: webClass.status,
                phone: phoneData.normalized,
                reviewsCount: tags.opening_hours ? 5 : 2,
                category: cat,
                rating: 4.5,
              });

              const cleanTg = extractTelegramUsername(rawTg) || (webClass.tgLink ? extractTelegramUsername(webClass.tgLink) : undefined);
              const cleanVk = cleanVkUrl(rawVk) || webClass.vkLink;

              const audit = calculateLostProfitAudit({ category: cat, district: assignedDistrict, name, city: targetCity });

              const leadItem: BryanskLead = {
                id: `osm-${el.id}-${Date.now()}`,
                name,
                category: cat,
                city: targetCity,
                address,
                district: assignedDistrict,
                lat,
                lon,
                phone: phoneData.normalized,
                formattedPhone: phoneData.display,
                whatsappPhone: phoneData.whatsappLink ? phoneData.normalized?.replace('+', '') : undefined,
                hasWhatsapp: Boolean(phoneData.whatsappLink),
                telegram: cleanTg,
                isTgVerified: false,
                vk: cleanVk,
                isVkVerified: false,
                website: rawWebsite,
                verifiedDomains: webClass.cleanDomain ? [webClass.cleanDomain] : [],
                websiteStatus: webClass.status,
                confidence: 'HIGH',
                reviewsCount: tags.opening_hours ? 7 : 3,
                rating: 4.6,
                source: 'OpenStreetMap',
                foundDate: new Date().toISOString().split('T')[0],
                lastCheckedDate: new Date().toISOString().split('T')[0],
                potential,
                crmStatus: 'NEW',
                notes: `Найдено в г. ${targetCity}. ${webClass.status === 'NO_WEBSITE' ? 'Сайт отсутствует! Отличная возможность для FORM STUDIO.' : 'Требует проверки наличия онлайн-записи.'}`,
                isFavorite: false,
                interactions: [],
                estimatedLossMonthly: audit.monthlyLossMin,
              };

              newDiscoveredLeads.push(leadItem);
              foundCount++;
              existingNames.add(normName);
              if (phoneData.normalized) existingPhones.add(phoneData.normalized);

              activeScanState.totalFound = foundCount;
              addLog(
                `[${new Date().toLocaleTimeString('ru-RU')}] + Найдено: ${name} (г. ${targetCity}) — ${webClass.status === 'NO_WEBSITE' ? 'БЕЗ САЙТА' : 'Есть сайт'}`
              );
            }
          }
        } catch (err: any) {
          addLog(`[${new Date().toLocaleTimeString('ru-RU')}] Ошибка запроса по категории "${cat}": ${err.message}`);
        }
      }

      if ((activeScanState as any).scanSessionId === scanSessionId) {
        if (newDiscoveredLeads.length > 0) {
          const freshLeads = loadLeads();
          saveLeads([...newDiscoveredLeads, ...freshLeads]);
          addLog(
            `[${new Date().toLocaleTimeString('ru-RU')}] Успешно сохранено ${newDiscoveredLeads.length} новых организаций (г. ${targetCity}) в базу!`
          );
        } else {
          addLog(
            `[${new Date().toLocaleTimeString('ru-RU')}] Новых недублирующихся предприятий в г. ${targetCity} не обнаружено.`
          );
        }

        activeScanState.progress = 100;
        activeScanState.isScanning = false;
        addLog(`[${new Date().toLocaleTimeString('ru-RU')}] Сканирование успешно завершено.`);
      }
    } catch (fatal: any) {
      activeScanState.isScanning = false;
      addLog(`[${new Date().toLocaleTimeString('ru-RU')}] Сбой сканирования: ${fatal.message}`);
    }
  })();

  return NextResponse.json({
    success: true,
    message: 'Сканирование запущено',
    state: activeScanState,
  });
}
