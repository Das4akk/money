/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BryanskLead, WebsiteStatus, LeadPotential, CRMStatus, District, InteractionLog } from '../utils/leadLogic';

export type { BryanskLead, WebsiteStatus, LeadPotential, CRMStatus, District, InteractionLog };

export type ViewType =
  | 'dashboard'
  | 'all-leads'
  | 'no-website'
  | 'has-website'
  | 'needs-review'
  | 'contacts'
  | 'favorites'
  | 'scanner'
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
  newToday: number;
  highPotential: number;
  mediumPotential: number;
  lowPotential: number;
  byDistrict: Record<District, number>;
  byCrmStatus: Record<CRMStatus, number>;
}

export interface ScanState {
  isScanning: boolean;
  progress: number;
  totalFound: number;
  currentCategory: string;
  currentDistrict: string;
  logs: string[];
  startTime?: string;
  stopped?: boolean;
}

export interface AppSettings {
  twoGisApiKey?: string;
  yandexApiKey?: string;
  googlePlacesApiKey?: string;
  dadataApiKey?: string;
  crawlerTimeoutSeconds: number;
  enableOverpass: boolean;
  rateLimitPerMinute: number;
  autoCheckWebsites: boolean;
  hasGeminiApiKey: boolean;
  overpassStatus: string;
}

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
  CALLED: { label: 'Позвонили', color: 'bg-amber-950/60 text-amber-300', border: 'border-amber-800/40' },
  AWAITING_REPLY: { label: 'Ожидаем ответа', color: 'bg-purple-950/60 text-purple-300', border: 'border-purple-800/40' },
  INTERESTED: { label: 'Заинтересован', color: 'bg-emerald-900/60 text-emerald-200', border: 'border-emerald-600/50' },
  REJECTED: { label: 'Отказ', color: 'bg-rose-950/60 text-rose-300', border: 'border-rose-800/40' },
  CLIENT: { label: 'Клиент', color: 'bg-white text-black font-semibold', border: 'border-white' },
  ARCHIVED: { label: 'Неактуально', color: 'bg-zinc-900 text-zinc-500', border: 'border-zinc-800' },
};

export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, { label: string; bg: string; text: string; desc: string }> = {
  NO_WEBSITE: {
    label: 'NO WEBSITE',
    bg: 'bg-rose-950/40 border-rose-900/50',
    text: 'text-rose-400',
    desc: 'Собственный сайт отсутствует',
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
    desc: 'Только соцсети (VK, TG, Inst)',
  },
  DIRECTORY_ONLY: {
    label: 'DIRECTORY ONLY',
    bg: 'bg-blue-950/40 border-blue-900/50',
    text: 'text-blue-400',
    desc: 'Только справочники (2GIS, Zoon, Yandex)',
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
