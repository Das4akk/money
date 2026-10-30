/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadLeads } from '@/lib/db';
import { formatLeadsToTxtDocument } from '@/lib/leadLogic';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'xlsx';
  const filter = searchParams.get('filter') || 'all';
  const city = searchParams.get('city') || 'all';

  let leads = loadLeads();

  if (city !== 'all' && city.trim()) {
    leads = leads.filter((l) => (l.city || 'Брянск').toLowerCase() === city.toLowerCase().trim());
  }

  if (filter === 'no-website') {
    leads = leads.filter((l) => l.websiteStatus === 'NO_WEBSITE' || l.websiteStatus === 'SOCIAL_ONLY');
  } else if (filter === 'with-telegram') {
    leads = leads.filter((l) => Boolean(l.telegram || l.hasTelegramDirect));
  } else if (filter === 'with-whatsapp') {
    leads = leads.filter((l) => l.hasWhatsapp);
  } else if (filter === 'high-potential') {
    leads = leads.filter((l) => l.potential === 'HIGH');
  }

  const rows = leads.map((l, index) => ({
    '№': index + 1,
    'Название организации': l.name,
    'Категория': l.category,
    'Город': l.city || 'Брянск',
    'Район': l.district,
    'Адрес': l.address,
    'Телефон': l.phone || l.formattedPhone || 'Не указан',
    'WhatsApp': l.hasWhatsapp ? `https://wa.me/${l.whatsappPhone}` : 'Не найден',
    'Telegram': l.telegram || (l.hasTelegramDirect ? l.telegramUrl : 'Не найден'),
    'Статус TG': l.isTgVerified ? 'Проверен' : 'Авто',
    'ВКонтакте': l.vk || 'Не найден',
    'Статус VK': l.isVkVerified ? 'Проверен' : 'Авто',
    'Сайт': l.website || 'Отсутствует',
    'Статус сайта': l.websiteStatus,
    'Потенциал клиента': l.potential,
    'Статус CRM': l.crmStatus,
    'Оценка упущенной выручки (руб/мес)': l.estimatedLossMonthly || 150000,
    'Рейтинг': l.rating,
    'Отзывов': l.reviewsCount,
    'Источник данных': l.source,
    'Дата обнаружения': l.foundDate,
    'Заметки': l.notes,
  }));

  if (format === 'json') {
    return NextResponse.json(leads, {
      headers: {
        'Content-Disposition': `attachment; filename="leads_${city !== 'all' ? city : 'all'}.json"`,
      },
    });
  }

  if (format === 'txt') {
    // Generate exact user format:
    // Предприятие: ...
    // Название предприятия: ...
    // Номер: ...
    // Контакты: ...
    // Есть сайт/нету: ...
    const txtContent = '\uFEFF' + formatLeadsToTxtDocument(leads);
    const filename = `leads_${city !== 'all' ? city : 'all'}_${filter}.txt`;
    return new NextResponse(txtContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  }

  if (format === 'csv') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const bomCsv = '\uFEFF' + csv;
    return new NextResponse(bomCsv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leads_export.csv"',
      },
    });
  }

  // Default: XLSX
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Лиды Брянск');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leads_bryansk.xlsx"',
    },
  });
}
