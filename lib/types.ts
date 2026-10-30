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
  | 'CONTACTED_VK'
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
  | 'Фокинский район'
  | string;

export interface InteractionLog {
  id: string;
  date: string;
  type: 'call' | 'whatsapp' | 'telegram' | 'vk' | 'email' | 'meeting' | 'note';
  text: string;
  author: string;
}

export interface BryanskLead {
  id: string;
  name: string;
  category: string;
  city?: string;
  address: string;
  district: District;
  lat?: number;
  lon?: number;
  phone?: string;
  formattedPhone?: string;
  whatsappPhone?: string;
  hasWhatsapp?: boolean;
  telegram?: string;
  telegramUrl?: string;
  telegramType?: 'channel' | 'username' | 'direct_phone' | 'invite';
  hasTelegramDirect?: boolean;
  isTgVerified?: boolean;
  tgVerificationNote?: string;
  vk?: string;
  isVkVerified?: boolean;
  vkVerificationNote?: string;
  website?: string;
  verifiedDomains?: string[];
  websiteStatus: WebsiteStatus;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reviewsCount: number;
  rating: number;
  source: 'OpenStreetMap' | '2GIS' | 'Yandex' | 'Google' | 'Manual' | 'Bryansk_Reestr';
  sourceUrl?: string;
  inn?: string;
  foundDate: string;
  lastCheckedDate: string;
  potential: LeadPotential;
  crmStatus: CRMStatus;
  notes: string;
  isFavorite: boolean;
  interactions: InteractionLog[];
  nextContactDate?: string;
  estimatedLossMonthly?: number; // Estimated lost revenue in RUB
}

export type ViewType =
  | 'dashboard'
  | 'all-leads'
  | 'no-website'
  | 'has-website'
  | 'needs-review'
  | 'contacts'
  | 'favorites'
  | 'scanner'
  | 'message-generator'
  | 'settings';

export interface DashboardStats {
  total: number;
  noWebsite: number;
  hasWebsite: number;
  socialOnly: number;
  directoryOnly: number;
  needsReview: number;
  websiteInactive: number;
  phonesFound: number;
  telegramFound: number;
  telegramChannelsFound: number;
  telegramDirectFound: number;
  whatsappFound: number;
  vkFound: number;
  newToday: number;
  highPotential: number;
  mediumPotential: number;
  lowPotential: number;
  totalEstimatedLoss: number;
  byDistrict: Record<District, number>;
  byCrmStatus: Record<CRMStatus, number>;
}

export interface ScanState {
  isScanning: boolean;
  progress: number;
  totalFound: number;
  currentCategory: string;
  currentDistrict: string;
  currentCity?: string;
  logs: string[];
  startTime?: string;
  stopped?: boolean;
}

export interface AppSettings {
  senderName: string;
  companyName: string;
  senderRole: string;
  defaultCity?: string;
  portfolioUrl?: string;
  customSignature?: string;
  twoGisApiKey?: string;
  yandexApiKey?: string;
  googlePlacesApiKey?: string;
  dadataApiKey?: string;
  crawlerTimeoutSeconds: number;
  enableOverpass: boolean;
  rateLimitPerMinute: number;
  autoCheckWebsites: boolean;
}

export type MessageChannel = 'whatsapp' | 'telegram' | 'vk' | 'call_script' | 'proposal';

export type MessageAngle =
  | 'profit_and_booking'
  | 'short_hook'
  | 'free_concept'
  | 'audit_losses'
  | 'partnership';

export interface GeneratePitchParams {
  leadId?: string;
  customLead?: {
    name: string;
    category: string;
    city?: string;
    district: District;
    phone?: string;
    website?: string;
    vk?: string;
    telegram?: string;
    notes?: string;
  };
  channel: MessageChannel;
  angle: MessageAngle;
  emphasizeBookingBarrier: boolean; // Not everyone wants to call/chat directly, silent customers leak away!
  senderName?: string;
  companyName?: string;
  includeCalculations?: boolean;
}

export const POPULAR_CITIES = [
  'Брянск',
  'Москва',
  'Санкт-Петербург',
  'Орел',
  'Смоленск',
  'Курск',
  'Калуга',
  'Воронеж',
  'Тула',
  'Липецк',
  'Белгород',
  'Рязань',
  'Тверь',
  'Ярославль',
  'Владимир',
  'Иваново',
  'Кострома',
  'Тамбов',
  'Нижний Новгород',
  'Казань',
  'Самара',
  'Уфа',
  'Пермь',
  'Саратов',
  'Тольятти',
  'Ижевск',
  'Ульяновск',
  'Пенза',
  'Чебоксары',
  'Киров',
  'Ростов-на-Дону',
  'Краснодар',
  'Сочи',
  'Волгоград',
  'Астрахань',
  'Ставрополь',
  'Новороссийск',
  'Таганрог',
  'Севастополь',
  'Симферополь',
  'Екатеринбург',
  'Челябинск',
  'Тюмень',
  'Магнитогорск',
  'Курган',
  'Сургут',
  'Нижневартовск',
  'Новосибирск',
  'Омск',
  'Красноярск',
  'Барнаул',
  'Иркутск',
  'Томск',
  'Кемерово',
  'Новокузнецк',
  'Хабаровск',
  'Владивосток',
  'Калининград',
  'Архангельск',
  'Мурманск',
  'Вологда',
  'Череповец',
  'Петрозаводск',
  'Великий Новгород',
  'Псков',
];

export const BRYANSK_DISTRICTS: District[] = [
  'Советский район',
  'Бежицкий район',
  'Володарский район',
  'Фокинский район',
];

export const BRYANSK_CATEGORIES = [
  'Автосервисы',
  'Автомойки',
  'Шиномонтажи',
  'СТО',
  'Барбершопы',
  'Салоны красоты',
  'Парикмахерские',
  'Ногтевые студии',
  'Массажные кабинеты',
  'Стоматологии',
  'Частные медицинские центры',
  'Ветеринарные клиники',
  'Мебельные производства',
  'Мебельные мастерские',
  'Строительные компании',
  'Ремонт квартир',
  'Натяжные потолки',
  'Оконные компании',
  'Дверные компании',
  'Рекламные агентства',
  'Типографии',
  'Фотостудии',
  'Кафе',
  'Рестораны',
  'Пекарни',
  'Кондитерские',
  'Магазины одежды',
  'Магазины электроники',
  'Цветочные магазины',
  'Гостиницы',
  'Частные образовательные центры',
  'Спортивные студии',
  'Клининговые компании',
  'Ритуальные услуги',
  'Другие локальные предприятия',
];

export const CRM_STATUS_LABELS: Record<CRMStatus, { label: string; color: string; border: string }> = {
  NEW: { label: 'Новый лид', color: 'bg-white/10 text-white', border: 'border-white/20' },
  NOT_CONTACTED: { label: 'Не связывались', color: 'bg-zinc-800 text-zinc-300', border: 'border-zinc-700' },
  CONTACTED_TG: { label: 'Написали в TG', color: 'bg-sky-950/60 text-sky-300', border: 'border-sky-800/40' },
  CONTACTED_WA: { label: 'Написали в WA', color: 'bg-emerald-950/60 text-emerald-300', border: 'border-emerald-800/40' },
  CONTACTED_VK: { label: 'Написали в VK', color: 'bg-blue-950/60 text-blue-300', border: 'border-blue-800/40' },
  CALLED: { label: 'Позвонили', color: 'bg-amber-950/60 text-amber-300', border: 'border-amber-800/40' },
  AWAITING_REPLY: { label: 'Ожидаем ответа', color: 'bg-purple-950/60 text-purple-300', border: 'border-purple-800/40' },
  INTERESTED: { label: 'Заинтересован', color: 'bg-emerald-900/60 text-emerald-200', border: 'border-emerald-600/50' },
  REJECTED: { label: 'Отказ', color: 'bg-rose-950/60 text-rose-300', border: 'border-rose-800/40' },
  CLIENT: { label: 'Клиент FORM STUDIO', color: 'bg-amber-400 text-black font-bold', border: 'border-amber-300' },
  ARCHIVED: { label: 'Архив', color: 'bg-zinc-900 text-zinc-500', border: 'border-zinc-800' },
};

export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, { label: string; bg: string; text: string; desc: string }> = {
  NO_WEBSITE: {
    label: 'NO WEBSITE',
    bg: 'bg-rose-950/40 border-rose-900/50',
    text: 'text-rose-400',
    desc: 'Собственный сайт отсутствует (Горячий лид)',
  },
  HAS_WEBSITE: {
    label: 'HAS WEBSITE',
    bg: 'bg-emerald-950/40 border-emerald-900/50',
    text: 'text-emerald-400',
    desc: 'Собственный сайт обнаружен',
  },
  SOCIAL_ONLY: {
    label: 'SOCIAL ONLY',
    bg: 'bg-amber-950/40 border-amber-900/50',
    text: 'text-amber-400',
    desc: 'Только соцсети (VK / TG / Inst)',
  },
  DIRECTORY_ONLY: {
    label: 'DIRECTORY ONLY',
    bg: 'bg-blue-950/40 border-blue-900/50',
    text: 'text-blue-400',
    desc: 'Только справочники (2GIS, Zoon, Яндекс)',
  },
  NEEDS_REVIEW: {
    label: 'NEEDS REVIEW',
    bg: 'bg-purple-950/40 border-purple-900/50',
    text: 'text-purple-400',
    desc: 'Требуется ручная проверка',
  },
  WEBSITE_INACTIVE: {
    label: 'WEBSITE INACTIVE',
    bg: 'bg-orange-950/40 border-orange-900/50',
    text: 'text-orange-400',
    desc: 'Сайт найден, но не открывается (ошибка)',
  },
};

