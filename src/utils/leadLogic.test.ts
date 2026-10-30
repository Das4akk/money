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
  filterLeads,
  BryanskLead,
} from './leadLogic';

test('normalizeRussianPhone formats mobile and generates WhatsApp link', () => {
  const res1 = normalizeRussianPhone('+7 (920) 845-12-34');
  assert.equal(res1.normalized, '+79208451234');
  assert.equal(res1.whatsappLink, 'https://wa.me/79208451234');
  assert.equal(res1.display, '+7 (920) 845-12-34');

  // Bryansk 6-digit landline
  const res2 = normalizeRussianPhone('64-21-00');
  assert.equal(res2.normalized, '+74832642100');
  assert.equal(res2.whatsappLink, undefined); // Landline has no WhatsApp
});

test('validateTelegramUsername discards invalid handles and reserved words', () => {
  assert.equal(validateTelegramUsername('garage32_bryansk'), true);
  assert.equal(validateTelegramUsername('@topgun_bryansk'), true);

  // False positives
  assert.equal(validateTelegramUsername('admin'), false); // Reserved
  assert.equal(validateTelegramUsername('12345678'), false); // Pure numbers
  assert.equal(validateTelegramUsername('_invalid_'), false); // Starts/ends with _
  assert.equal(validateTelegramUsername('ab'), false); // Too short
  assert.equal(validateTelegramUsername('user@domain.com'), false); // Email
});

test('resolveTelegramContact finds handles and generates direct phone chat links', () => {
  // Direct channel handle
  const res1 = resolveTelegramContact('@bryansk_auto', '+79201112233');
  assert.equal(res1.telegram, '@bryansk_auto');
  assert.equal(res1.telegramUrl, 'https://t.me/bryansk_auto');
  assert.equal(res1.telegramType, 'channel');
  assert.equal(res1.hasTelegramDirect, true);

  // Mobile phone direct TG resolution when no channel handle published
  const res2 = resolveTelegramContact(undefined, '+79208451122');
  assert.equal(res2.telegram, '+79208451122');
  assert.equal(res2.telegramUrl, 'https://t.me/+79208451122');
  assert.equal(res2.telegramType, 'direct_phone');
  assert.equal(res2.hasTelegramDirect, true);

  // Landline has no Telegram
  const res3 = resolveTelegramContact(undefined, '+74832642100');
  assert.equal(res3.hasTelegramDirect, false);
});

test('classifyWebsiteStatus correctly separates social pages, directories and real domains', () => {
  // Empty
  assert.equal(classifyWebsiteStatus(undefined).status, 'NO_WEBSITE');
  assert.equal(classifyWebsiteStatus('').status, 'NO_WEBSITE');

  // VKontakte
  const vk = classifyWebsiteStatus('https://vk.com/avtoservis_bryansk');
  assert.equal(vk.status, 'SOCIAL_ONLY');
  assert.equal(vk.vkLink, 'https://vk.com/avtoservis_bryansk');

  // 2GIS directory
  const twoGis = classifyWebsiteStatus('https://2gis.ru/bryansk/firm/70000001018283921');
  assert.equal(twoGis.status, 'DIRECTORY_ONLY');

  // Real standalone website
  const site = classifyWebsiteStatus('https://bryansk-stoma-clinic.ru');
  assert.equal(site.status, 'HAS_WEBSITE');
  assert.equal(site.cleanDomain, 'bryansk-stoma-clinic.ru');
});

test('calculateLeadPotential identifies HIGH value prospects without websites', () => {
  // High value category + no website + phone
  const highPotential = calculateLeadPotential({
    websiteStatus: 'NO_WEBSITE',
    phone: '+79201234567',
    reviewsCount: 12,
    category: 'Стоматологии',
    rating: 4.8,
  });
  assert.equal(highPotential, 'HIGH');

  // Already has a website
  const lowPotential = calculateLeadPotential({
    websiteStatus: 'HAS_WEBSITE',
    phone: '+79201234567',
    reviewsCount: 20,
    category: 'Стоматологии',
    rating: 4.9,
  });
  assert.equal(lowPotential, 'LOW');
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

  // Filter by district
  const sov = filterLeads(mockLeads, { district: 'Советский район' });
  assert.equal(sov.length, 1);
  assert.equal(sov[0].id, '1');

  // Filter by website status
  const noWeb = filterLeads(mockLeads, { websiteStatus: 'NO_WEBSITE' });
  assert.equal(noWeb.length, 1);
  assert.equal(noWeb[0].id, '1');

  // Filter by query "Литейная"
  const qRes = filterLeads(mockLeads, { query: 'литейная' });
  assert.equal(qRes.length, 1);
  assert.equal(qRes[0].id, '2');

  // Favorites
  const favs = filterLeads(mockLeads, { onlyFavorites: true });
  assert.equal(favs.length, 1);
  assert.equal(favs[0].id, '2');
});
