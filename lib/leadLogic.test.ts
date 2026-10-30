/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyWebsiteStatus,
  calculateLeadPotential,
  normalizeRussianPhone,
  extractTelegramUsername,
  validateTelegramUsername,
  resolveTelegramContact,
  cleanVkUrl,
  calculateLostProfitAudit,
  generateFormStudioPitch,
  filterLeads,
  formatLeadToTxtBlock,
  formatLeadsToTxtDocument,
} from './leadLogic';
import { BryanskLead } from './types';

test('normalizeRussianPhone formats mobile and generates WhatsApp link', () => {
  const res1 = normalizeRussianPhone('+7 (920) 845-12-34');
  assert.equal(res1.normalized, '+79208451234');
  assert.equal(res1.whatsappLink, 'https://wa.me/79208451234');
  assert.equal(res1.display, '+7 (920) 845-12-34');

  // Bryansk 6-digit landline
  const res2 = normalizeRussianPhone('64-21-00');
  assert.equal(res2.normalized, '+74832642100');
  assert.equal(res2.whatsappLink, undefined);
});

test('validateTelegramUsername discards invalid handles and reserved words', () => {
  assert.equal(validateTelegramUsername('garage32_bryansk'), true);
  assert.equal(validateTelegramUsername('@topgun_bryansk'), true);
  assert.equal(validateTelegramUsername('admin'), false);
  assert.equal(validateTelegramUsername('share'), false);
  assert.equal(validateTelegramUsername('12345678'), false);
  assert.equal(validateTelegramUsername('_invalid_'), false);
  assert.equal(validateTelegramUsername('ab'), false);
});

test('cleanVkUrl validates real VK groups and rejects false positives', () => {
  assert.equal(cleanVkUrl('https://vk.com/garage32_service'), 'https://vk.com/garage32_service');
  assert.equal(cleanVkUrl('vk.com/estet_dent32'), 'https://vk.com/estet_dent32');
  assert.equal(cleanVkUrl('https://vk.com/share.php?url=...'), undefined);
  assert.equal(cleanVkUrl('https://vk.com/away.php?to=...'), undefined);
});

test('resolveTelegramContact finds handles and generates direct phone chat links', () => {
  const res1 = resolveTelegramContact('@bryansk_auto', '+79201112233');
  assert.equal(res1.telegram, '@bryansk_auto');
  assert.equal(res1.telegramUrl, 'https://t.me/bryansk_auto');
  assert.equal(res1.telegramType, 'channel');
  assert.equal(res1.hasTelegramDirect, true);

  const res2 = resolveTelegramContact(undefined, '+79208451122');
  assert.equal(res2.telegram, '+79208451122');
  assert.equal(res2.telegramUrl, 'https://t.me/+79208451122');
  assert.equal(res2.telegramType, 'direct_phone');
  assert.equal(res2.hasTelegramDirect, true);
});

test('calculateLostProfitAudit includes booking barrier and lost customer estimate', () => {
  const audit = calculateLostProfitAudit({
    category: 'Стоматологии',
    district: 'Советский район',
    name: 'Эстет-Дент',
  });
  assert.ok(audit.monthlyLossMin > 100000);
  assert.ok(audit.silentCustomersLossPercent >= 40);
  assert.ok(audit.breakdownReasons.length >= 4);
});

test('generateFormStudioPitch generates customized outreach with Daniil and FORM STUDIO', () => {
  const pitch = generateFormStudioPitch({
    enterpriseName: 'Автосервис Гараж 32',
    category: 'Автосервисы',
    district: 'Советский район',
    channel: 'whatsapp',
    angle: 'profit_and_booking',
    emphasizeBookingBarrier: true,
    senderName: 'Даниил',
    companyName: 'FORM STUDIO',
  });

  assert.ok(pitch.includes('Даниил'));
  assert.ok(pitch.includes('FORM STUDIO'));
  assert.ok(pitch.includes('онлайн-запис') || pitch.includes('звонить'));
  assert.ok(pitch.includes('Гараж 32'));
});

test('filterLeads filters by category, district, website status and text query', () => {
  const mockLeads: BryanskLead[] = [
    {
      id: '1',
      name: 'Автосервис Гараж 32',
      category: 'Автосервисы',
      address: 'г. Брянск, ул. Фокина, д. 10',
      district: 'Советский район',
      phone: '+79201112233',
      hasWhatsapp: true,
      websiteStatus: 'NO_WEBSITE',
      verifiedDomains: [],
      confidence: 'HIGH',
      reviewsCount: 8,
      rating: 4.6,
      source: 'OpenStreetMap',
      foundDate: '2026-10-29',
      lastCheckedDate: '2026-10-29',
      potential: 'HIGH',
      crmStatus: 'NEW',
      notes: '',
      isFavorite: false,
      interactions: [],
    },
    {
      id: '2',
      name: 'Клиника Дента Брянск',
      category: 'Стоматологии',
      address: 'г. Брянск, ул. Литейная, д. 45',
      district: 'Бежицкий район',
      phone: '+79209998877',
      hasWhatsapp: false,
      websiteStatus: 'HAS_WEBSITE',
      verifiedDomains: ['denta32.ru'],
      confidence: 'HIGH',
      reviewsCount: 25,
      rating: 4.9,
      source: '2GIS',
      foundDate: '2026-10-29',
      lastCheckedDate: '2026-10-29',
      potential: 'LOW',
      crmStatus: 'NOT_CONTACTED',
      notes: '',
      isFavorite: true,
      interactions: [],
    },
  ];

  const sov = filterLeads(mockLeads, { district: 'Советский район' });
  assert.equal(sov.length, 1);
  assert.equal(sov[0].id, '1');

  const qRes = filterLeads(mockLeads, { query: 'литейная' });
  assert.equal(qRes.length, 1);
  assert.equal(qRes[0].id, '2');
});

test('formatLeadToTxtBlock strictly outputs the 5 specified lines for lead without website', () => {
  const lead: BryanskLead = {
    id: 'test-1',
    name: 'Автосервис Премиум',
    category: 'Автосервисы',
    city: 'Воронеж',
    address: 'ул. Ленина, 40',
    district: 'Центральный район',
    phone: '+79201112233',
    formattedPhone: '+7 (920) 111-22-33',
    whatsappPhone: '79201112233',
    hasWhatsapp: true,
    telegram: '@autopremium',
    isTgVerified: true,
    vk: 'https://vk.com/autopremium',
    isVkVerified: true,
    websiteStatus: 'NO_WEBSITE',
    confidence: 'HIGH',
    reviewsCount: 12,
    rating: 4.8,
    source: 'OpenStreetMap',
    foundDate: '2026-10-30',
    lastCheckedDate: '2026-10-30',
    potential: 'HIGH',
    crmStatus: 'NEW',
    notes: '',
    isFavorite: false,
    interactions: [],
  };

  const block = formatLeadToTxtBlock(lead);
  const lines = block.split(/\r?\n/);

  assert.equal(lines.length, 5);
  assert.equal(lines[0], 'Предприятие: Автосервисы');
  assert.equal(lines[1], 'Название предприятия: Автосервис Премиум');
  assert.equal(lines[2], 'Номер: +7 (920) 111-22-33');
  assert.ok(lines[3].startsWith('Контакты: '));
  assert.ok(lines[3].includes('WA: https://wa.me/79201112233'));
  assert.ok(lines[3].includes('TG: @autopremium'));
  assert.ok(lines[3].includes('VK: https://vk.com/autopremium'));
  assert.equal(lines[4], 'Есть сайт/нету: Нету');
});

test('formatLeadToTxtBlock outputs "Есть: URL" when enterprise has website', () => {
  const lead: BryanskLead = {
    id: 'test-2',
    name: 'Стоматология Улыбка',
    category: 'Стоматологии',
    city: 'Смоленск',
    address: 'ул. Гагарина, 12',
    district: 'Ленинский район',
    phone: '+79001234567',
    website: 'https://smol-ulybka.ru',
    websiteStatus: 'HAS_WEBSITE',
    confidence: 'HIGH',
    reviewsCount: 15,
    rating: 4.9,
    source: 'OpenStreetMap',
    foundDate: '2026-10-30',
    lastCheckedDate: '2026-10-30',
    potential: 'LOW',
    crmStatus: 'NEW',
    notes: '',
    isFavorite: false,
    interactions: [],
  };

  const block = formatLeadToTxtBlock(lead);
  const lines = block.split(/\r?\n/);

  assert.equal(lines.length, 5);
  assert.equal(lines[0], 'Предприятие: Стоматологии');
  assert.equal(lines[1], 'Название предприятия: Стоматология Улыбка');
  assert.equal(lines[4], 'Есть сайт/нету: Есть: https://smol-ulybka.ru');
});

