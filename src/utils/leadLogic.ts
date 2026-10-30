/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WebsiteStatus =
  | 'NO_WEBSITE'
  | 'HAS_WEBSITE'
  | 'SOCIAL_ONLY'
  | 'DIRECTORY_ONLY'
  | 'NEEDS_REVIEW'
  | 'WEBSITE_INACTIVE';

export type LeadPotential = 'HIGH' | 'MEDIUM' | 'LOW';

export type CRMStatus =
  | 'NEW'
  | 'NOT_CONTACTED'
  | 'CONTACTED_TG'
  | 'CONTACTED_WA'
  | 'CALLED'
  | 'AWAITING_REPLY'
  | 'INTERESTED'
  | 'REJECTED'
  | 'CLIENT'
  | 'ARCHIVED';

export type District =
  | 'Советский район'
  | 'Бежицкий район'
  | 'Володарский район'
  | 'Фокинский район';

export interface InteractionLog {
  id: string;
  date: string;
  type: 'call' | 'whatsapp' | 'telegram' | 'meeting' | 'note';
  text: string;
  author?: string;
}

export interface BryanskLead {
  id: string;
  name: string;
  category: string;
  address: string;
  district: District;
  lat?: number;
  lon?: number;
  phone?: string;
  formattedPhone?: string;
  whatsappPhone?: string;
  hasWhatsapp: boolean;
  telegram?: string;
  telegramType?: 'channel' | 'username' | 'direct_phone' | 'invite';
  telegramUrl?: string;
  hasTelegramDirect?: boolean;
  vk?: string;
  website?: string;
  verifiedDomains: string[];
  websiteStatus: WebsiteStatus;
  websiteCheckDate?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reviewsCount: number;
  rating: number;
  source: 'OpenStreetMap' | '2GIS' | 'Yandex' | 'Google Places' | 'DaData' | 'Manual';
  sourceUrl?: string;
  foundDate: string;
  lastCheckedDate: string;
  potential: LeadPotential;
  crmStatus: CRMStatus;
  notes: string;
  isFavorite: boolean;
  interactions: InteractionLog[];
  nextContactDate?: string;
  chatLink?: string;
  inn?: string;
}

// Known social media domains that are NOT standalone company websites
const SOCIAL_DOMAINS = [
  'vk.com',
  'm.vk.com',
  'vk.me',
  't.me',
  'telegram.me',
  'instagram.com',
  'ok.ru',
  'facebook.com',
  'fb.com',
  'tiktok.com',
  'youtube.com',
  'rutube.ru',
];

// Known directories, aggregators and listing portals
const DIRECTORY_DOMAINS = [
  '2gis.ru',
  'yandex.ru/maps',
  'maps.yandex.ru',
  'yandex.ru/profile',
  'google.com/maps',
  'zoon.ru',
  'yell.ru',
  'spr.ru',
  'prodoctorov.ru',
  'avito.ru',
  'blizko.ru',
  'pulscen.ru',
  'flamp.ru',
  'firmaspravka.ru',
  'orgpage.ru',
  'yp.ru',
  'b2b-bryansk.ru',
  'bryansk.all-gorod.ru',
  'infomesto.com',
];

// Commercial categories where having no website gives HIGH sales conversion
const HIGH_VALUE_CATEGORIES = [
  'Стоматологии',
  'Частные медицинские центры',
  'Строительные компании',
  'Ремонт квартир',
  'Мебельные производства',
  'Натяжные потолки',
  'Оконные компании',
  'Дверные компании',
  'Автосервисы',
  'СТО',
  'Салоны красоты',
  'Барбершопы',
  'Гостиницы',
  'Клининговые компании',
  'Рекламные агентства',
  'Частные образовательные центры',
];

/**
 * Normalizes a Russian phone number to standard format +7XXXXXXXXXX
 */
export function normalizeRussianPhone(phone: string | undefined): {
  normalized?: string;
  whatsappLink?: string;
  display?: string;
} {
  if (!phone) return {};
  const cleaned = phone.replace(/[^0-9]/g, '');

  let digits = cleaned;
  if (cleaned.length === 11) {
    if (cleaned.startsWith('8') || cleaned.startsWith('7')) {
      digits = '7' + cleaned.substring(1);
    }
  } else if (cleaned.length === 10) {
    digits = '7' + cleaned;
  } else if (cleaned.length === 6) {
    // Bryansk landline without city code 4832
    digits = '74832' + cleaned;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    const formatted = `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
    const isMobile = digits.startsWith('79');
    return {
      normalized: `+${digits}`,
      display: formatted,
      whatsappLink: isMobile ? `https://wa.me/${digits}` : undefined,
    };
  }

  return {
    normalized: phone,
    display: phone,
  };
}

// Blacklisted usernames that are generic words or false positives
const TELEGRAM_RESERVED_WORDS = new Set([
  'admin',
  'administrator',
  'telegram',
  'channel',
  'support',
  'group',
  'null',
  'undefined',
  'contact',
  'mail',
  'gmail',
  'yandex',
  'mail_ru',
  'gmail_com',
  'bot',
  'user',
  'share',
  'joinchat',
  'addstickers',
  'proxy',
  'socks',
]);

/**
 * Validates a Telegram username against Telegram official handle criteria:
 * - 5 to 32 characters
 * - Latin letters, numbers, and underscores
 * - Cannot start or end with underscore, cannot contain consecutive underscores
 * - Cannot be pure digits
 * - Cannot be a reserved / generic system word
 */
export function validateTelegramUsername(handle: string | undefined): boolean {
  if (!handle) return false;
  const clean = handle.startsWith('@') ? handle.substring(1) : handle;

  if (clean.length < 4 || clean.length > 32) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) return false;
  if (clean.startsWith('_') || clean.endsWith('_')) return false;
  if (clean.includes('__')) return false;
  // Cannot be pure digits
  if (/^\d+$/.test(clean)) return false;
  // Cannot be reserved
  if (TELEGRAM_RESERVED_WORDS.has(clean.toLowerCase())) return false;

  return true;
}

/**
 * Extracts and strictly validates a Telegram username from raw string or URL
 */
export function extractTelegramUsername(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();

  // If email address was passed by mistake, discard
  if (trimmed.includes('@') && trimmed.includes('.') && !trimmed.startsWith('@')) {
    return undefined;
  }

  // If it's a join link (invite)
  const joinMatch = trimmed.match(/(?:t\.me|telegram\.me)\/(\+[a-zA-Z0-9_-]+|joinchat\/[a-zA-Z0-9_-]+)/i);
  if (joinMatch && joinMatch[1]) {
    return `t.me/${joinMatch[1]}`;
  }

  // Direct t.me/username
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

  // Raw alphanumeric handle without dots or slashes
  if (/^[a-zA-Z0-9_]{4,32}$/.test(trimmed) && !trimmed.includes('.') && !trimmed.includes('/')) {
    if (validateTelegramUsername(trimmed)) {
      return `@${trimmed}`;
    }
  }

  return undefined;
}

/**
 * Resolves complete Telegram contact details for an enterprise,
 * including official public handles (@username), invite links, or direct 1-click mobile phone chat.
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

  // If enterprise has a verified Russian mobile phone (+79XXXXXXXXX), Telegram allows direct chat link: https://t.me/+79XXXXXXXXX
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
 * Classifies website status based on provided URL and alternate links
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
    const lower = link.toLowerCase();
    if (lower.includes('vk.com') || lower.includes('vk.me')) {
      if (!vkLink) vkLink = link;
    }
    if (lower.includes('t.me') || lower.includes('telegram.me')) {
      if (!tgLink) tgLink = link;
    }
  }

  if (!url || !url.trim()) {
    if (vkLink || tgLink) {
      return { status: 'SOCIAL_ONLY', vkLink, tgLink };
    }
    return { status: 'NO_WEBSITE', vkLink, tgLink };
  }

  const cleanUrl = url.trim().toLowerCase();

  // Check if it's a social network
  for (const soc of SOCIAL_DOMAINS) {
    if (cleanUrl.includes(soc)) {
      return {
        status: 'SOCIAL_ONLY',
        cleanDomain: soc,
        vkLink: cleanUrl.includes('vk.com') ? url : vkLink,
        tgLink: cleanUrl.includes('t.me') ? url : tgLink,
      };
    }
  }

  // Check if it's a directory / map listing
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

  // Extract hostname
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
    // Invalid URL format
  }

  return {
    status: 'NEEDS_REVIEW',
    vkLink,
    tgLink,
  };
}

/**
 * Calculates lead potential based on website status, presence of phone/reviews, and category
 */
export function calculateLeadPotential(data: {
  websiteStatus: WebsiteStatus;
  phone?: string;
  reviewsCount?: number;
  category: string;
  rating?: number;
}): LeadPotential {
  const { websiteStatus, phone, reviewsCount = 0, category, rating = 0 } = data;

  // If enterprise already has a working website, potential is generally LOW
  if (websiteStatus === 'HAS_WEBSITE') {
    return 'LOW';
  }

  const hasPhone = Boolean(phone && phone.trim().length > 5);
  const isHighValueCategory = HIGH_VALUE_CATEGORIES.some((c) =>
    category.toLowerCase().includes(c.toLowerCase())
  );
  const hasActiveCustomers = reviewsCount >= 2 || rating >= 4.0;

  // HIGH: No website or social only, active with phone and reviews, or high commercial category
  if (
    (websiteStatus === 'NO_WEBSITE' || websiteStatus === 'SOCIAL_ONLY') &&
    hasPhone &&
    (isHighValueCategory || hasActiveCustomers)
  ) {
    return 'HIGH';
  }

  // MEDIUM: No website or directory only, business exists, has basic contact
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
 * Filters a list of leads according to query and filters
 */
export function filterLeads(
  leads: BryanskLead[],
  filters: {
    query?: string;
    category?: string;
    district?: string;
    websiteStatus?: string;
    crmStatus?: string;
    potential?: string;
    hasTelegram?: boolean;
    hasWhatsapp?: boolean;
    onlyFavorites?: boolean;
  }
): BryanskLead[] {
  return leads.filter((lead) => {
    if (filters.onlyFavorites && !lead.isFavorite) return false;
    if (filters.category && lead.category !== filters.category) return false;
    if (filters.district && lead.district !== filters.district) return false;
    if (filters.websiteStatus && lead.websiteStatus !== filters.websiteStatus) return false;
    if (filters.crmStatus && lead.crmStatus !== filters.crmStatus) return false;
    if (filters.potential && lead.potential !== filters.potential) return false;
    if (filters.hasTelegram && !lead.telegram) return false;
    if (filters.hasWhatsapp && !lead.hasWhatsapp) return false;

    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone?.toLowerCase().includes(q) || false;
      const matchAddress = lead.address.toLowerCase().includes(q);
      const matchCategory = lead.category.toLowerCase().includes(q);
      const matchInn = lead.inn?.includes(q) || false;
      if (!matchName && !matchPhone && !matchAddress && !matchCategory && !matchInn) {
        return false;
      }
    }

    return true;
  });
}
