/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { loadLeads, loadSettings } from '@/lib/db';
import {
  generateFormStudioPitch,
  calculateLostProfitAudit,
} from '@/lib/leadLogic';
import { MessageChannel, MessageAngle, District } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      leadId,
      customLead,
      channel = 'whatsapp' as MessageChannel,
      angle = 'profit_and_booking' as MessageAngle,
      emphasizeBookingBarrier = true,
      senderName,
      companyName,
    } = body;

    const settings = loadSettings();
    const resolvedSender = senderName || settings.senderName || 'Даниил';
    const resolvedCompany = companyName || settings.companyName || 'FORM STUDIO';

    let enterpriseName = 'Организация';
    let category = 'Бизнес';
    let city = 'Брянск';
    let district: District = 'Советский район';
    let phone: string | undefined = '';
    let websiteStatus: string | undefined = 'NO_WEBSITE';
    let vk: string | undefined = '';
    let telegram: string | undefined = '';
    let notes: string | undefined = '';

    if (leadId) {
      const leads = loadLeads();
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        enterpriseName = lead.name;
        category = lead.category;
        city = lead.city || 'Брянск';
        district = lead.district;
        phone = lead.phone || lead.formattedPhone;
        websiteStatus = lead.websiteStatus;
        vk = lead.vk;
        telegram = lead.telegram;
        notes = lead.notes;
      }
    } else if (customLead) {
      enterpriseName = customLead.name || 'Организация';
      category = customLead.category || 'Услуги';
      city = customLead.city || 'Брянск';
      district = customLead.district || 'Советский район';
      phone = customLead.phone;
      websiteStatus = customLead.website ? 'HAS_WEBSITE' : 'NO_WEBSITE';
      vk = customLead.vk;
      telegram = customLead.telegram;
      notes = customLead.notes;
    }

    const audit = calculateLostProfitAudit({ category, district, name: enterpriseName, city });

    // Fallback generator initialized in advance
    const fallbackText = generateFormStudioPitch({
      enterpriseName,
      category,
      city,
      district,
      phone,
      websiteStatus: websiteStatus as any,
      vk,
      telegram,
      channel,
      angle,
      emphasizeBookingBarrier,
      senderName: resolvedSender,
      companyName: resolvedCompany,
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `Ты — ${resolvedSender}, основатель веб-студии ${resolvedCompany} (г. ${city}).
Ты пишешь прямое, вежливое, но жестко аргументированное коммерческое предложение / сообщение для предпринимателя города ${city}.

ДАННЫЕ О БИЗНЕСЕ:
- Название организации: "${enterpriseName}"
- Ниша / Категория: ${category}
- Город и Район: г. ${city}, ${district}
- Телефон / WhatsApp: ${phone || 'Указан номер'}
- Статус сайта: ${websiteStatus} (${vk ? 'Есть только группа VK: ' + vk : 'Собственного сайта нет'})
- Заметки / Специфика: ${notes || `Локальный бизнес в ${city}`}

РАСЧЕТ УПУЩЕННОЙ ПРИБЫЛИ (${resolvedCompany} AUDIT):
- Ежемесячные потери выручки: от ${audit.monthlyLossMin.toLocaleString('ru-RU')} до ${audit.monthlyLossMax.toLocaleString('ru-RU')} руб./мес.
- Потеря клиентов в месяц: порядка ${audit.lostCustomersPerMonth} чел.
- Средний чек в этой нише в г. ${city}: ~${audit.averageCheckRub.toLocaleString('ru-RU')} руб.

ОБЯЗАТЕЛЬНЫЕ КЛЮЧЕВЫЕ ТРЕБОВАНИЯ:
1. АВТОР: Ты ${resolvedSender} из студии ${resolvedCompany} (г. ${city}). Твоя студия делает конверсионные сайты, квизы и системы мгновенной онлайн-записи.
2. ФАКТОР МОЛЧАЛИВЫХ КЛИЕНТОВ (БАРЬЕР ЗВОНКА): Обязательно подчеркни, что ${
          emphasizeBookingBarrier
            ? 'до 50% современных клиентов (особенно молодежь и занятые люди) КАТЕГОРИЧЕСКИ НЕ ХОТЯТ звонить голосом по телефону или долго списываться в чатах, выясняя цены и свободные окна. Им нужен сайт, где за 30 секунд виден прайс и можно записаться/оставить заявку онлайн. Если сайта с онлайн-записью нет — они просто молча уходят к конкурентам, у которых это есть!'
            : 'покажи важность быстрого приема заявок'
        }
3. ДЕТАЛИЗАЦИЯ УПУЩЕННОЙ ПРИБЫЛИ: Подробно и на цифрах распиши, почему без тебя и твоего решения клиент теряет прибыль прямо сейчас (потеря топа Яндекса по г. ${city}, слабая конверсия групп ВК, барьер звонка, ночные заявки в никуда).
4. КАНАЛ ОТПРАВКИ: ${channel.toUpperCase()} (форматируй именно под этот мессенджер/канал: с удобными абзацами, уместными эмодзи, без простыней текста).
5. СТИЛЬ / УГОЛ: ${angle}.
6. ПРИЗЫВ К ДЕЙСТВИЮ: Предложи посмотреть готовый 2-минутный интерактивный концепт / прототип сайта, который ${resolvedCompany} уже разработала под их сферу в г. ${city}.

Напиши итоговый текст сообщения на чистом русском языке, готовый для моментальной отправки.`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        // Timeout to ensure instant response
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        if (response && response.text) {
          return NextResponse.json({
            success: true,
            pitchText: response.text.trim(),
            channel,
            angle,
            source: 'gemini',
            generatedAt: new Date().toISOString(),
            audit,
          });
        }
      } catch (err) {
        console.warn('Gemini generation error or timeout, using smart FORM STUDIO fallback:', err);
      }
    }

    return NextResponse.json({
      success: true,
      pitchText: fallbackText,
      channel,
      angle,
      source: 'form_studio_engine',
      generatedAt: new Date().toISOString(),
      audit,
    });
  } catch (error: any) {
    console.error('Error generating pitch:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate pitch' },
      { status: 500 }
    );
  }
}
