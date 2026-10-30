/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BryanskLead,
  WebsiteStatus,
  LeadPotential,
  District,
  MessageChannel,
  MessageAngle,
} from './types';

// Reserved and generic system handles that are NOT real business Telegram accounts
export const TELEGRAM_RESERVED_WORDS = new Set([
  'admin',
  'administrator',
  'telegram',
  'channel',
  'group',
  'support',
  'help',
  'bot',
  'share',
  'contact',
  'joinchat',
  'media',
  'news',
  'login',
  'signin',
  'signup',
  'settings',
  'privacy',
  'terms',
  'about',
  'app',
  'api',
  'official',
  'public',
  'broadcast',
  'download',
  'stickers',
  'wallet',
  'username',
  'account',
]);

// False positive VK urls to ignore
export const VK_RESERVED_SLUGS = new Set([
  'share.php',
  'share',
  'away.php',
  'away',
  'widget',
  'feed',
  'im',
  'friends',
  'groups',
  'photos',
  'audios',
  'videos',
  'docs',
  'bookmarks',
  'settings',
  'search',
  'app',
  'apps',
  'dev',
  'about',
  'help',
  'support',
  'club1',
  'public1',
]);

// Known social and directory domains
export const SOCIAL_DOMAINS = [
  'vk.com',
  'vk.me',
  't.me',
  'telegram.me',
  'ok.ru',
  'instagram.com',
  'facebook.com',
  'rutube.ru',
  'youtube.com',
  'tiktok.com',
  'taplink.cc',
];

export const DIRECTORY_DOMAINS = [
  '2gis.ru',
  'yandex.ru/maps',
  'maps.yandex.ru',
  'yandex.ru/profile',
  'zoon.ru',
  'avito.ru',
  'prodoctorov.ru',
  'doctu.ru',
  'sberb2b.ru',
  'rusprofile.ru',
  'spark-interfax.ru',
  'checko.ru',
  'orgpage.ru',
  'yp.ru',
  'gisvid.ru',
  'pulscen.ru',
  'tiu.ru',
];

export const HIGH_VALUE_CATEGORIES = [
  'Стоматологии',
  'Частные медицинские центры',
  'Автосервисы',
  'СТО',
  'Строительные компании',
  'Ремонт квартир',
  'Мебельные производства',
  'Мебельные мастерские',
  'Натяжные потолки',
  'Оконные компании',
  'Дверные компании',
  'Салоны красоты',
  'Барбершопы',
  'Ветеринарные клиники',
  'Рекламные агентства',
];

/**
 * Normalizes Russian phone numbers into standard E.164 and localized formats.
 * Handles +7, 8, 10-digit mobile, and Bryansk 6-digit landlines (04832 / 4832).
 */
export function normalizeRussianPhone(raw: string | undefined): {
  normalized?: string;
  display?: string;
  whatsappLink?: string;
  isMobile: boolean;
} {
  if (!raw) return { isMobile: false };

  let digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return { isMobile: false };

  // Bryansk 6-digit local landline: prefix with Bryansk city code 4832
  if (digits.length === 6) {
    digits = `74832${digits}`;
  }

  // 10 digits without country prefix (e.g. 9208451122 or 4832642100)
  if (digits.length === 10) {
    digits = `7${digits}`;
  }

  // 11 digits starting with 8 -> convert to 7
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    const isMobile = digits.startsWith('79');
    const partCode = digits.slice(1, 4);
    const part1 = digits.slice(4, 7);
    const part2 = digits.slice(7, 9);
    const part3 = digits.slice(9, 11);

    const formatted = `+7 (${partCode}) ${part1}-${part2}-${part3}`;
    const e164 = `+${digits}`;

    return {
      normalized: e164,
      display: formatted,
      whatsappLink: isMobile ? `https://wa.me/${digits}` : undefined,
      isMobile,
    };
  }

  return {
    normalized: raw.trim(),
    display: raw.trim(),
    isMobile: false,
  };
}

/**
 * Validates a Telegram username according to strict rules:
 * - 4 to 32 alphanumeric or underscore characters
 * - Cannot start or end with underscore, no consecutive underscores
 * - Cannot be pure digits or reserved word
 */
export function validateTelegramUsername(handle: string | undefined): boolean {
  if (!handle) return false;
  const clean = handle.startsWith('@') ? handle.substring(1) : handle;
  if (clean.length < 4 || clean.length > 32) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) return false;
  if (clean.startsWith('_') || clean.endsWith('_')) return false;
  if (clean.includes('__')) return false;
  if (/^\d+$/.test(clean)) return false;
  if (TELEGRAM_RESERVED_WORDS.has(clean.toLowerCase())) return false;
  return true;
}

/**
 * Extracts and strictly validates a Telegram username from a string or URL
 */
export function extractTelegramUsername(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();

  // If email was given by mistake
  if (trimmed.includes('@') && trimmed.includes('.') && !trimmed.startsWith('@')) {
    return undefined;
  }

  // Invite link (t.me/+xyz or joinchat)
  const joinMatch = trimmed.match(/(?:t\.me|telegram\.me)\/(\+[a-zA-Z0-9_-]+|joinchat\/[a-zA-Z0-9_-]+)/i);
  if (joinMatch && joinMatch[1]) {
    return `t.me/${joinMatch[1]}`;
  }

  // t.me/username
  const match = trimmed.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,32})/i);
  if (match && match[1]) {
    const candidate = match[1];
    if (validateTelegramUsername(candidate)) {
      return `@${candidate}`;
    }
  }

  // Handle starting with @
  if (trimmed.startsWith('@')) {
    const candidate = trimmed.substring(1);
    if (validateTelegramUsername(candidate)) {
      return `@${candidate}`;
    }
  }

  // Direct alphanumeric handle
  if (/^[a-zA-Z0-9_]{4,32}$/.test(trimmed) && !trimmed.includes('.') && !trimmed.includes('/')) {
    if (validateTelegramUsername(trimmed)) {
      return `@${trimmed}`;
    }
  }

  return undefined;
}

/**
 * Resolves Telegram contact details, supporting handles, invite links,
 * or direct mobile phone chat (https://t.me/+79...).
 */
export function resolveTelegramContact(
  rawTelegram?: string,
  normalizedPhone?: string
): {
  telegram?: string;
  telegramUrl?: string;
  telegramType?: 'channel' | 'username' | 'direct_phone' | 'invite';
  hasTelegramDirect: boolean;
} {
  const extracted = extractTelegramUsername(rawTelegram);
  if (extracted) {
    if (extracted.startsWith('@')) {
      const handle = extracted.substring(1);
      return {
        telegram: extracted,
        telegramUrl: `https://t.me/${handle}`,
        telegramType: 'channel',
        hasTelegramDirect: true,
      };
    }
    if (extracted.startsWith('t.me/')) {
      return {
        telegram: extracted,
        telegramUrl: `https://${extracted}`,
        telegramType: 'invite',
        hasTelegramDirect: true,
      };
    }
  }

  // If enterprise has a verified Russian mobile phone (+79...), Telegram allows direct chat
  if (normalizedPhone && normalizedPhone.startsWith('+79') && normalizedPhone.length === 12) {
    const cleanDigits = normalizedPhone.replace(/[^0-9]/g, '');
    return {
      telegram: `+${cleanDigits}`,
      telegramUrl: `https://t.me/+${cleanDigits}`,
      telegramType: 'direct_phone',
      hasTelegramDirect: true,
    };
  }

  return {
    hasTelegramDirect: false,
  };
}

/**
 * Validates and normalizes VK group or profile link
 */
export function cleanVkUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();

  // Match vk.com/slug or vk.me/slug
  const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:vk\.com|vk\.me)\/([a-zA-Z0-9_.-]+)/i);
  if (match && match[1]) {
    const slug = match[1].toLowerCase();
    if (VK_RESERVED_SLUGS.has(slug)) {
      return undefined;
    }
    if (slug.length < 2 || slug.length > 50) return undefined;
    return `https://vk.com/${match[1]}`;
  }

  // If user provided just "club12345" or "public12345" or a custom slug
  if (/^[a-zA-Z0-9_.-]{3,35}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    const slug = trimmed.toLowerCase();
    if (VK_RESERVED_SLUGS.has(slug)) return undefined;
    return `https://vk.com/${trimmed}`;
  }

  return undefined;
}

/**
 * Generates search URLs to verify VK community or Telegram channel in Bryansk
 */
export function getContactSearchLinks(leadName: string, district?: string, phone?: string) {
  const cleanName = leadName.replace(/["«»]/g, '').trim();
  const vkSearchUrl = `https://vk.com/search?c%5Bsection%5D=communities&c%5Bq%5D=${encodeURIComponent(
    `${cleanName} Брянск`
  )}`;
  const yandexSearchUrl = `https://yandex.ru/search/?text=${encodeURIComponent(
    `${cleanName} Брянск ${district || ''} контакты telegram vk официальный`
  )}`;
  const twoGisSearchUrl = `https://2gis.ru/bryansk/search/${encodeURIComponent(cleanName)}`;

  let tgPhoneUrl: string | undefined;
  if (phone && phone.startsWith('+79')) {
    const digits = phone.replace(/[^0-9]/g, '');
    tgPhoneUrl = `https://t.me/+${digits}`;
  }

  return {
    vkSearchUrl,
    yandexSearchUrl,
    twoGisSearchUrl,
    tgPhoneUrl,
  };
}

/**
 * Classifies website status
 */
export function classifyWebsiteStatus(
  url: string | undefined,
  otherLinks: string[] = []
): {
  status: WebsiteStatus;
  cleanDomain?: string;
  vkLink?: string;
  tgLink?: string;
} {
  let vkLink: string | undefined;
  let tgLink: string | undefined;
  const allLinks = [url, ...otherLinks].filter(Boolean) as string[];

  for (const link of allLinks) {
    const cleanedVk = cleanVkUrl(link);
    if (cleanedVk && !vkLink) vkLink = cleanedVk;

    const extractedTg = extractTelegramUsername(link);
    if (extractedTg && !tgLink) tgLink = extractedTg;
  }

  if (!url || !url.trim()) {
    if (vkLink || tgLink) {
      return { status: 'SOCIAL_ONLY', vkLink, tgLink };
    }
    return { status: 'NO_WEBSITE', vkLink, tgLink };
  }

  const cleanUrl = url.trim().toLowerCase();

  for (const soc of SOCIAL_DOMAINS) {
    if (cleanUrl.includes(soc)) {
      return {
        status: 'SOCIAL_ONLY',
        cleanDomain: soc,
        vkLink: cleanVkUrl(url) || vkLink,
        tgLink: extractTelegramUsername(url) || tgLink,
      };
    }
  }

  for (const dir of DIRECTORY_DOMAINS) {
    if (cleanUrl.includes(dir)) {
      return {
        status: 'DIRECTORY_ONLY',
        cleanDomain: dir,
        vkLink,
        tgLink,
      };
    }
  }

  try {
    const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `http://${cleanUrl}`);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host.includes('.')) {
      return {
        status: 'HAS_WEBSITE',
        cleanDomain: host,
        vkLink,
        tgLink,
      };
    }
  } catch {
    // Malformed
  }

  return {
    status: 'NEEDS_REVIEW',
    vkLink,
    tgLink,
  };
}

/**
 * Calculates lead potential
 */
export function calculateLeadPotential(data: {
  websiteStatus: WebsiteStatus;
  phone?: string;
  reviewsCount?: number;
  category: string;
  rating?: number;
}): LeadPotential {
  const { websiteStatus, phone, reviewsCount = 0, category, rating = 0 } = data;

  if (websiteStatus === 'HAS_WEBSITE') {
    return 'LOW';
  }

  const hasPhone = Boolean(phone && phone.trim().length > 5);
  const isHighValue = HIGH_VALUE_CATEGORIES.some((c) =>
    category.toLowerCase().includes(c.toLowerCase())
  );
  const hasActiveReviews = reviewsCount >= 2 || rating >= 4.0;

  if (
    (websiteStatus === 'NO_WEBSITE' || websiteStatus === 'SOCIAL_ONLY') &&
    hasPhone &&
    (isHighValue || hasActiveReviews)
  ) {
    return 'HIGH';
  }

  if (
    (websiteStatus === 'NO_WEBSITE' ||
      websiteStatus === 'SOCIAL_ONLY' ||
      websiteStatus === 'DIRECTORY_ONLY' ||
      websiteStatus === 'WEBSITE_INACTIVE') &&
    (hasPhone || reviewsCount > 0)
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Calculates detailed lost profit and customer leaks for Bryansk enterprises
 * Includes the critical "Silent Customer / Booking Barrier" factor!
 */
export function calculateLostProfitAudit(lead: Partial<BryanskLead>): {
  monthlyLossMin: number;
  monthlyLossMax: number;
  lostCustomersPerMonth: number;
  silentCustomersLossPercent: number; // Percentage lost due to having to call/chat
  averageCheckRub: number;
  annualLossMin: number;
  annualLossMax: number;
  breakdownReasons: { title: string; desc: string; lostSharePercent: number }[];
  recommendationFormula: string;
} {
  const category = (lead.category || '').toLowerCase();
  let avgCheck = 3500;
  let lostClients = 20;

  if (category.includes('стомат') || category.includes('медицин') || category.includes('клиник')) {
    avgCheck = 7500;
    lostClients = 25;
  } else if (category.includes('автосервис') || category.includes('сто') || category.includes('ремонт авто') || category.includes('кузов')) {
    avgCheck = 9000;
    lostClients = 22;
  } else if (category.includes('строит') || category.includes('ремонт кварт') || category.includes('потол') || category.includes('окна') || category.includes('двери')) {
    avgCheck = 65000;
    lostClients = 4;
  } else if (category.includes('мебел') || category.includes('кухн')) {
    avgCheck = 95000;
    lostClients = 3;
  } else if (category.includes('красот') || category.includes('барбер') || category.includes('ногт') || category.includes('парикмах')) {
    avgCheck = 2200;
    lostClients = 45;
  } else if (category.includes('ветеринар')) {
    avgCheck = 3000;
    lostClients = 28;
  } else if (category.includes('кафе') || category.includes('ресторан') || category.includes('банкет')) {
    avgCheck = 4500;
    lostClients = 35;
  }

  const baseMonthly = avgCheck * lostClients;
  const monthlyLossMin = Math.round(baseMonthly * 0.85);
  const monthlyLossMax = Math.round(baseMonthly * 1.35);
  const annualLossMin = monthlyLossMin * 12;
  const annualLossMax = monthlyLossMax * 12;

  const silentCustomersLossPercent = 48; // 48% bounce because they hate calling/texting without instant booking

  const breakdownReasons = [
    {
      title: 'Барьер звонка и переписки (Фактор «Молчаливого клиента»)',
      desc: 'До 45–55% современных клиентов категорически не хотят звонить по телефону или вести долгую переписку в личке ради уточнения свободных окон и цен. Им нужен выбор даты/услуги и бронь за 30 секунд. Не найдя онлайн-записи, они молча закрывают карточку и уходят к конкурентам.',
      lostSharePercent: 48,
    },
    {
      title: 'Утечка горячего спроса из Яндекс Поиска и Карт',
      desc: `По запросам "${lead.category || 'услуги'} ${lead.city || 'Брянск'} ${lead.district || ''}" первые строчки занимают конкуренты с конверсионными сайтами и квизами. Организация без сайта отдает им до 70% органического поискового трафика.`,
      lostSharePercent: 32,
    },
    {
      title: 'Слабая конверсия соцсетей и групп VK',
      desc: 'Группа ВКонтакте не индексируется в топ Яндекса по коммерческим транзакционным ключам. Конверсия из посетителя в заявку в VK составляет всего 0.8–1.5%, тогда как конверсионный лендинг от FORM STUDIO дает 4–9%.',
      lostSharePercent: 12,
    },
    {
      title: 'Отсутствие круглосуточного захвата заявок (24/7)',
      desc: 'Более 35% запросов поступают в нерабочие часы (вечер, ночь, выходные). Без сайта с автоматической формой эти клиенты не получают ответа вовремя и заказывают в другом месте.',
      lostSharePercent: 8,
    },
  ];

  return {
    monthlyLossMin,
    monthlyLossMax,
    lostCustomersPerMonth: lostClients,
    silentCustomersLossPercent,
    averageCheckRub: avgCheck,
    annualLossMin,
    annualLossMax,
    breakdownReasons,
    recommendationFormula:
      'Конверсионный сайт от FORM STUDIO с квиз-расчетом и быстрой записью в WhatsApp/Telegram окупается за первые 2–4 недели даже при возврате всего 2–3 клиентов в месяц.',
  };
}

/**
 * Deterministic, instant pitch generator for Daniil (FORM STUDIO)
 * Works even offline or without Gemini API key, perfectly calibrated for businesses across any city!
 */
export function generateFormStudioPitch(params: {
  enterpriseName: string;
  category: string;
  city?: string;
  district: District;
  phone?: string;
  websiteStatus?: WebsiteStatus;
  vk?: string;
  telegram?: string;
  channel: MessageChannel;
  angle: MessageAngle;
  emphasizeBookingBarrier: boolean;
  senderName?: string;
  companyName?: string;
}): string {
  const sender = params.senderName || 'Даниил';
  const company = params.companyName || 'FORM STUDIO';
  const city = params.city || 'Брянск';
  const name = params.enterpriseName;
  const district = params.district;
  const category = params.category;
  const audit = calculateLostProfitAudit({ category, district, name, city });

  const bookingBarrierSnippet = params.emphasizeBookingBarrier
    ? `\n\nВажный момент, который мы постоянно видим в г. ${city}: до 50% платежеспособных клиентов сегодня категорически не хотят звонить голосом или ждать ответа в чатах. Им психологически проще нажать 2 кнопки, увидеть прозрачный прайс и записаться онлайн за 30 секунд. Без удобной формы или сайта этот поток просто молча уходит к конкурентам.`
    : '';

  const lossSnippet = `Ориентировочные потери бизнеса из-за отсутствия сайта в Яндексе и онлайн-записи составляют от ${audit.monthlyLossMin.toLocaleString(
    'ru-RU'
  )} до ${audit.monthlyLossMax.toLocaleString('ru-RU')} руб. в месяц (около ${audit.lostCustomersPerMonth} упущенных клиентов).`;

  if (params.channel === 'whatsapp') {
    if (params.angle === 'short_hook') {
      return `Здравствуйте, ${name}! 👋\n\nМеня зовут ${sender}, веб-студия ${company} (г. ${city}).\n\nЗаметил, что у вас отличные отзывы в локации ${district}, но для сферы «${category}» у вас пока нет полноценного сайта для заявок из Яндекса.${bookingBarrierSnippet}\n\nМы на днях собрали интерактивный прототип сайта-квиза специально под вашу сферу в г. ${city}. Удобно прислать ссылку на 2-минутный просмотр прямо сюда в WhatsApp?`;
    }

    if (params.angle === 'profit_and_booking') {
      return `Здравствуйте, ${name}! 🤝\n\nМеня зовут ${sender}, я руковожу студией ${company} (г. ${city}). Специализируемся на привлечении клиентов для бизнеса в сфере «${category}».\n\nПроанализировали выдачу Яндекса по региону г. ${city} (${district}):\n${lossSnippet}${bookingBarrierSnippet}\n\nСайт от ${company} с понятной онлайн-записью окупается уже за первые 2-3 недели за счет возврата тех клиентов, которые сейчас уходят к конкурентам.\n\nМы уже подготовили черновой интерактивный концепт сайта именно под вас. Подскажите, интересно взглянуть на макет?`;
    }

    if (params.angle === 'free_concept') {
      return `Приветствую, ${name}! 🚀\n\nМеня зовут ${sender} (${company}, г. ${city}).\n\nМы сейчас делаем кейс для сферы «${category}» в нашем городе и бесплатно разработали готовый концепт современного продающего сайта для вашей организации (${district}).${bookingBarrierSnippet}\n\nВ нем есть онлайн-расчет стоимости, портфолио и моментальная запись в WhatsApp/Telegram без барьера звонков.\n\nНикаких обязательств — просто посмотрите макет и дайте обратную связь. Прислать ссылку сюда?`;
    }

    if (params.angle === 'audit_losses') {
      return `Здравствуйте! Это руководство «${name}»?\n\nМеня зовут ${sender}, студия ${company} (${city}).\n\nСделали аудит видимости вашего бизнеса в ${district}:\n1. По запросам «${category.toLowerCase()} ${city}» вы теряете топовые позиции в Яндексе.\n2. ${bookingBarrierSnippet.replace('\n\n', '')}\n3. ${lossSnippet}\n\nГотовы показать, как закрыть эту дыру и получать от 15 до 30 дополнительных записей в месяц. Удобно пообщаться пару минут?`;
    }

    // Default partnership
    return `Здравствуйте, ${name}! 🤝\n\nМеня зовут ${sender}, студия ${company} (${city}).\n\nПредлагаю партнерство по масштабированию потока клиентов для «${name}» в ${district}.${bookingBarrierSnippet}\n\nМы берем на себя создание конверсионного сайта, настройку онлайн-записи и вывод в топ поиска ${city}. Можем обсудить детали и показать готовые примеры?`;
  }

  if (params.channel === 'telegram') {
    return `Здравствуйте, ${name}! ⚡\n\nПишет ${sender} из студии ${company} (г. ${city}).\n\nОбратил внимание на вашу компанию в ${district}. Для ниши «${category}» отсутствие сайта и онлайн-записи прямо сейчас уводит около ${audit.lostCustomersPerMonth} клиентов в месяц к конкурентам.${bookingBarrierSnippet}\n\nСобрали для вас наглядный интерактивный макет с квизом и быстрой бронью. Сбросить ссылку посмотреть?`;
  }

  if (params.channel === 'vk') {
    return `Здравствуйте, команда «${name}»! 👋\n\nМеня зовут ${sender}, веб-разработка и привлечение клиентов ${company} (${city}).\n\nОтличная страница ВКонтакте, но группа ВК закрывает только часть аудитории: из поиска Яндекса люди переходят на сайты конкурентов, а многие стесняются писать в ЛС и хотят записаться онлайн в один клик без звонков.${bookingBarrierSnippet}\n\nМы подготовили рабочий прототип современного сайта для ${category} в ${district}. Скажите, с кем из руководства можно поделиться ссылкой на макет?`;
  }

  if (params.channel === 'call_script') {
    return `📞 СКРИПТ ЗВОНКА (${sender} / ${company}):\n\n1. ВСТУПЛЕНИЕ:\n«Добрый день! Подскажите, пожалуйста, с кем могу пообщаться по поводу развития и сайта "${name}"? Меня зовут ${sender}, компания ${company} в г. ${city}».\n\n2. КРЮЧОК И БОЛЬ:\n«Я звоню буквально на 1 минуту. Мы проводили аудит сферы "${category}" по ${district} и заметили, что у вас сильная репутация, но совсем нет собственного сайта для приема заявок из Яндекса».\n\n3. ФАКТОР МОЛЧАЛИВЫХ КЛИЕНТОВ (КЛЮЧЕВОЙ АРГУМЕНТ):\n«Сейчас колоссальная часть людей (до 50%) вообще не любят звонить голосом или ждать ответов в чате. Если нет быстрой онлайн-записи и прозрачных цен на сайте, они моментально закрывают вкладку и уходят к конкурентам. Из-за этого вы теряете от ${audit.monthlyLossMin.toLocaleString('ru-RU')} руб. ежемесячно».\n\n4. ПРИЗЫВ К ДЕЙСТВИЮ (БЕЗ ДАВЛЕНИЯ):\n«Мы уже сделали для вас черновой интерактивный прототип сайта с квизом и онлайн-записью. Денег за просмотр не берем. Давайте я скину вам ссылку в WhatsApp или Telegram, вы посмотрите 2 минуты — и если понравится, обсудим внедрение? На какой номер удобнее отправить?»`;
  }

  // Proposal / КП
  return `📄 КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ ДЛЯ: ${name}\nАВТОР: ${sender} | ${company} (г. ${city})\nСФЕРА: ${category} | ЛОКАЦИЯ: ${district}\n\n🎯 1. АНАЛИЗ ПРОБЛЕМЫ И УТЕЧКИ КЛИЕНТОВ:\nПредприятие "${name}" обладает высоким потенциалом и доверием клиентов, однако отсутствие собственного веб-ресурса создает 2 критические точки потери выручки:\n• Утечка поискового трафика: потенциальные заказчики в ${city} ищут услуги через Яндекс, но попадают на сайты прямых конкурентов.\n• Барьер звонка («Фактор молчаливых клиентов»): 48% аудитории до 40 лет принципиально не делают телефонных звонков для записи. Не найдя онлайн-бронирования или прозрачного квиза, они уходят.\n\n💰 2. ОЦЕНКА УПУЩЕННОЙ ВЫРУЧКИ:\n• Потери в месяц: от ${audit.monthlyLossMin.toLocaleString('ru-RU')} до ${audit.monthlyLossMax.toLocaleString('ru-RU')} руб.\n• Потери в год: от ${audit.annualLossMin.toLocaleString('ru-RU')} до ${audit.annualLossMax.toLocaleString('ru-RU')} руб.\n\n🚀 3. РЕШЕНИЕ ОТ ${company}:\n• Разработка быстрого конверсионного сайта под ключ (адаптив под смартфоны 100%).\n• Интерактивный калькулятор стоимости/квиз для снятия сомнений клиента.\n• Моментальная онлайн-запись и связь в WhatsApp/Telegram без ожидания.\n• Базовая SEO-оптимизация под город ${city} (${district}).\n\nСроки запуска: 5–7 рабочих дней.\nОкупаемость проекта: первые 2–4 недели работы.`;
}

/**
 * Filter leads by criteria
 */
export function filterLeads(
  leads: BryanskLead[],
  filters: {
    query?: string;
    city?: string;
    category?: string;
    district?: string;
    websiteStatus?: string;
    crmStatus?: string;
    potential?: string;
    hasTelegram?: boolean;
    hasWhatsapp?: boolean;
    hasVk?: boolean;
    onlyFavorites?: boolean;
  }
): BryanskLead[] {
  return leads.filter((lead) => {
    if (filters.onlyFavorites && !lead.isFavorite) return false;
    if (filters.city && (lead.city || 'Брянск') !== filters.city) return false;
    if (filters.category && lead.category !== filters.category) return false;
    if (filters.district && lead.district !== filters.district) return false;
    if (filters.websiteStatus && lead.websiteStatus !== filters.websiteStatus) return false;
    if (filters.crmStatus && lead.crmStatus !== filters.crmStatus) return false;
    if (filters.potential && lead.potential !== filters.potential) return false;
    if (filters.hasTelegram && !lead.telegram && !lead.hasTelegramDirect) return false;
    if (filters.hasWhatsapp && !lead.hasWhatsapp) return false;
    if (filters.hasVk && !lead.vk) return false;

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone?.toLowerCase().includes(q) || false;
      const matchAddress = lead.address.toLowerCase().includes(q);
      const matchCategory = lead.category.toLowerCase().includes(q);
      const matchInn = lead.inn?.includes(q) || false;
      const matchTg = lead.telegram?.toLowerCase().includes(q) || false;
      const matchVk = lead.vk?.toLowerCase().includes(q) || false;

      if (!matchName && !matchPhone && !matchAddress && !matchCategory && !matchInn && !matchTg && !matchVk) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Strict 5-line TXT export format as requested:
 *
 * Предприятие:
 * Название предприятия:
 * Номер:
 * Контакты:
 * Есть сайт/нету:
 */
export function formatLeadToTxtBlock(lead: BryanskLead): string {
  const enterpriseType = lead.category || 'Предприятие';
  const name = lead.name || 'Без названия';
  const phone = lead.formattedPhone || lead.phone || 'Не указан';

  const contactParts: string[] = [];
  if (lead.formattedPhone || lead.phone) {
    contactParts.push(`Тел: ${lead.formattedPhone || lead.phone}`);
  }
  if (lead.hasWhatsapp && lead.whatsappPhone) {
    contactParts.push(`WA: https://wa.me/${lead.whatsappPhone}`);
  }
  if (lead.telegram || lead.hasTelegramDirect) {
    const tgDisplay = lead.telegram || (lead.telegramUrl ? lead.telegramUrl : undefined);
    if (tgDisplay) {
      contactParts.push(`TG: ${tgDisplay}${lead.isTgVerified ? ' (проверен)' : ''}`);
    }
  }
  if (lead.vk) {
    contactParts.push(`VK: ${lead.vk}${lead.isVkVerified ? ' (проверен)' : ''}`);
  }
  if (lead.address) {
    const cityPrefix = lead.city && !lead.address.includes(lead.city) ? `г. ${lead.city}, ` : '';
    contactParts.push(`Адрес: ${cityPrefix}${lead.address}`);
  }
  const contacts = contactParts.length > 0 ? contactParts.join(', ') : 'Не указаны';

  let websiteStatusText = 'Нету';
  if (lead.website && lead.website.trim().length > 0) {
    websiteStatusText = `Есть: ${lead.website.trim()}`;
  } else if (lead.websiteStatus === 'HAS_WEBSITE') {
    websiteStatusText = 'Есть';
  } else if (lead.websiteStatus === 'SOCIAL_ONLY') {
    websiteStatusText = 'Нету (только соцсети)';
  } else {
    websiteStatusText = 'Нету';
  }

  return [
    `Предприятие: ${enterpriseType}`,
    `Название предприятия: ${name}`,
    `Номер: ${phone}`,
    `Контакты: ${contacts}`,
    `Есть сайт/нету: ${websiteStatusText}`,
  ].join('\n');
}

export function formatLeadsToTxtDocument(leads: BryanskLead[]): string {
  return leads.map(formatLeadToTxtBlock).join('\n\n');
}

