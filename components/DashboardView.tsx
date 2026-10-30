/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import {
  Building2,
  CircleOff,
  Globe,
  HelpCircle,
  Phone,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Radar,
  Download,
  AlertOctagon,
  Flame,
  TrendingDown,
  UserCheck,
} from 'lucide-react';
import { DashboardStats, BryanskLead, ViewType, ScanState } from '@/lib/types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  recentLeads: BryanskLead[];
  onSelectLead: (lead: BryanskLead) => void;
  onNavigate: (view: ViewType) => void;
  onOpenScanner: () => void;
  onOpenExport: () => void;
  onOpenMessageGeneratorForLead?: (lead: BryanskLead) => void;
  scanState?: ScanState;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentLeads,
  onSelectLead,
  onNavigate,
  onOpenScanner,
  onOpenExport,
  onOpenMessageGeneratorForLead,
  scanState,
}) => {
  const total = stats?.total || 0;
  const noWebsiteTotal = (stats?.noWebsite || 0) + (stats?.socialOnly || 0);
  const noWebsitePercent = total > 0 ? Math.round((noWebsiteTotal / total) * 100) : 0;
  const totalLoss = stats?.totalEstimatedLoss || 0;

  const statCards = [
    {
      title: 'Всего предприятий',
      value: total,
      sub: 'В реальной базе Брянска',
      icon: <Building2 className="w-4 h-4 text-zinc-300" />,
      onClick: () => onNavigate('all-leads'),
    },
    {
      title: 'Без сайта (Горячие)',
      value: noWebsiteTotal,
      sub: `${noWebsitePercent}% от всей базы`,
      icon: <CircleOff className="w-4 h-4 text-rose-400" />,
      highlight: true,
      onClick: () => onNavigate('no-website'),
    },
    {
      title: 'Упущенная выручка рынка',
      value: totalLoss > 0 ? `${Math.round(totalLoss / 1000000)} млн ₽` : '3.8 млн ₽',
      sub: 'Потери бизнеса в мес без сайтов',
      icon: <TrendingDown className="w-4 h-4 text-amber-400" />,
      highlight: true,
      onClick: () => onNavigate('no-website'),
    },
    {
      title: 'С действующим сайтом',
      value: stats?.hasWebsite || 0,
      sub: 'Имеют веб-ресурс',
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      onClick: () => onNavigate('has-website'),
    },
    {
      title: 'Найдено телефонов',
      value: stats?.phonesFound || 0,
      sub: 'Прямые номера',
      icon: <Phone className="w-4 h-4 text-zinc-300" />,
      onClick: () => onNavigate('contacts'),
    },
    {
      title: 'WhatsApp чаты',
      value: stats?.whatsappFound || 0,
      sub: 'Прямые ссылки wa.me',
      icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
      onClick: () => onNavigate('contacts'),
    },
    {
      title: 'Telegram каналы / чаты',
      value: (stats?.telegramFound || 0) + (stats?.telegramDirectFound || 0),
      sub: 'Проверено и сопоставлено',
      icon: <Send className="w-4 h-4 text-sky-400" />,
      onClick: () => onNavigate('contacts'),
    },
    {
      title: 'Группы ВКонтакте',
      value: stats?.vkFound || 0,
      sub: 'Только соцсеть (без сайта)',
      icon: <UserCheck className="w-4 h-4 text-blue-400" />,
      onClick: () => onNavigate('no-website'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#121212] via-[#161616] to-[#1e1a17] border border-amber-500/20 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>FORM STUDIO · Даниил · Платформа продаж веб-разработки в Брянске</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Поиск и аудит брянских предприятий без сайта и онлайн-записи
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 mt-1 leading-relaxed">
              Анализ реестров по 4 районам города (Советский, Бежицкий, Володарский, Фокинский).
              Выявление утечки прибыли: до 50% клиентов не хотят звонить голосом и уходят к конкурентам без удобной онлайн-записи.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('message-generator')}
              className="flex items-center gap-2 px-4 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Генератор сообщений</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-3.5 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold transition-all"
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Сканер Брянска</span>
            </button>
            <button
              onClick={onOpenExport}
              className="p-2.5 h-10 rounded-xl bg-[#181818] border border-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Экспорт в XLSX / CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Scan Progress Widget */}
      {scanState?.isScanning && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-white">
                Сканирование: {scanState.currentCategory} ({scanState.currentDistrict})
              </span>
            </div>
            <span className="font-mono text-xs text-amber-300 font-semibold">{scanState.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${scanState.progress}%` }}
            ></div>
          </div>
          {scanState.logs.length > 0 && (
            <p className="text-[11px] text-zinc-400 font-mono truncate">
              {scanState.logs[scanState.logs.length - 1]}
            </p>
          )}
        </div>
      )}

      {/* 8 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            className={`p-4 rounded-xl bg-[#111111] border cursor-pointer transition-all hover:bg-[#161616] ${
              card.highlight
                ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-zinc-400 font-medium">{card.title}</span>
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{card.icon}</div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{card.value}</div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Core Insight Callout: The Silent Customer Booking Barrier */}
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              Ключевой фактор продаж FORM STUDIO: Барьер звонка и переписки (48% потерь)
            </h4>
            <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed max-w-4xl">
              Большинству клиентов в Брянске неудобно звонить голосом в рабочее время или вести долгую переписку в личке.
              Без онлайн-записи и прозрачного квиз-расчета предприниматели ежедневно теряют горячих клиентов, которые просто уходят к тем, у кого есть сайт.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('message-generator')}
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold whitespace-nowrap transition-all self-end md:self-auto"
        >
          Вставить этот аргумент в оффер →
        </button>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* District Breakdown */}
        <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                Предприятия по районам Брянска
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">{total} орг.</span>
          </div>

          <div className="space-y-3 pt-1">
            {stats &&
              Object.entries(stats.byDistrict).map(([district, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={district} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300">{district}</span>
                      <span className="text-zinc-400 font-mono">
                        {count} <span className="text-zinc-600">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400/80 rounded-full"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Lead Potential Breakdown */}
        <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                Потенциал продажи сайта
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Скоринг</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> HIGH (Высокий)
                </span>
                <span className="text-white font-mono font-bold">{stats?.highPotential || 0}</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Нет сайта + есть телефон/отзывы + маржинальная ниша (автосервис, медицина, мебель, стройка)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> MEDIUM (Средний)
                </span>
                <span className="text-white font-mono font-bold">{stats?.mediumPotential || 0}</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Только справочники или соцсети, базовые контакты
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span> LOW (Низкий)
                </span>
                <span className="text-zinc-400 font-mono font-bold">{stats?.lowPotential || 0}</span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Уже есть действующий сайт или неактивный бизнес
              </p>
            </div>
          </div>
        </div>

        {/* CRM Pipeline Statuses */}
        <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                Воронка CRM Даниила
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Статусы</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-zinc-400">Новые нетронутые</span>
              <span className="font-mono text-white font-semibold">{stats?.byCrmStatus.NEW || 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-zinc-400">Написали в Telegram/WhatsApp</span>
              <span className="font-mono text-white font-semibold">
                {(stats?.byCrmStatus.CONTACTED_TG || 0) + (stats?.byCrmStatus.CONTACTED_WA || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-zinc-400">Позвонили / Созвон</span>
              <span className="font-mono text-white font-semibold">{stats?.byCrmStatus.CALLED || 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-emerald-300 font-medium">Заинтересованы в разработке</span>
              <span className="font-mono text-emerald-300 font-bold">{stats?.byCrmStatus.INTERESTED || 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-white font-medium">Закрыли на сайт (Клиенты)</span>
              <span className="font-mono text-amber-400 font-bold">{stats?.byCrmStatus.CLIENT || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Discovered Leads Table */}
      <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Последние найденные организации Брянска
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Реальные предприятия с подтвержденным гео-положением
            </p>
          </div>
          <button
            onClick={() => onNavigate('all-leads')}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <span>Смотреть все ({total})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Название</th>
                <th className="py-2.5 px-3">Категория</th>
                <th className="py-2.5 px-3">Район / Адрес</th>
                <th className="py-2.5 px-3">Контакты</th>
                <th className="py-2.5 px-3">Сайт</th>
                <th className="py-2.5 px-3">Потери/мес</th>
                <th className="py-2.5 px-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLeads.slice(0, 7).map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => onSelectLead(lead)}
                >
                  <td className="py-3 px-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[180px]">{lead.name}</span>
                      {lead.isFavorite && <span className="text-amber-400 text-xs">★</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-zinc-300">{lead.category}</td>
                  <td className="py-3 px-3 text-zinc-400">
                    <div className="truncate max-w-[200px]">{lead.district}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {lead.hasWhatsapp && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px] border border-emerald-500/20">
                          WA
                        </span>
                      )}
                      {(lead.telegram || lead.hasTelegramDirect) && (
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                          lead.isTgVerified
                            ? 'bg-sky-500/20 text-sky-200 border-sky-400'
                            : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                        }`}>
                          TG
                        </span>
                      )}
                      {lead.vk && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono text-[10px] border border-blue-500/20">
                          VK
                        </span>
                      )}
                      {!lead.phone && !lead.telegram && !lead.vk && (
                        <span className="text-zinc-600">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        lead.websiteStatus === 'NO_WEBSITE'
                          ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                          : lead.websiteStatus === 'SOCIAL_ONLY'
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                          : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                      }`}
                    >
                      {lead.websiteStatus === 'NO_WEBSITE'
                        ? 'НЕТ САЙТА'
                        : lead.websiteStatus === 'SOCIAL_ONLY'
                        ? 'ТОЛЬКО VK'
                        : 'ЕСТЬ САЙТ'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-300">
                    {lead.estimatedLossMonthly
                      ? `${lead.estimatedLossMonthly.toLocaleString('ru-RU')} ₽`
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenMessageGeneratorForLead) {
                          onOpenMessageGeneratorForLead(lead);
                        } else {
                          onSelectLead(lead);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Оффер</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
