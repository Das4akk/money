/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  Clock,
  Radar,
  Download,
} from 'lucide-react';
import { DashboardStats, BryanskLead, ViewType, ScanState } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  recentLeads: BryanskLead[];
  onSelectLead: (lead: BryanskLead) => void;
  onNavigate: (view: ViewType) => void;
  onOpenScanner: () => void;
  onOpenExport: () => void;
  scanState?: ScanState;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentLeads,
  onSelectLead,
  onNavigate,
  onOpenScanner,
  onOpenExport,
  scanState,
}) => {
  const total = stats?.total || 0;
  const noWebsiteTotal = (stats?.noWebsite || 0) + (stats?.socialOnly || 0);
  const noWebsitePercent = total > 0 ? Math.round((noWebsiteTotal / total) * 100) : 0;

  const statCards = [
    {
      title: 'Всего предприятий',
      value: total,
      sub: 'В реальной базе Брянска',
      icon: <Building2 className="w-4 h-4 text-zinc-300" />,
      onClick: () => onNavigate('all-leads'),
    },
    {
      title: 'Без сайта (Лиды)',
      value: noWebsiteTotal,
      sub: `${noWebsitePercent}% от всей базы`,
      icon: <CircleOff className="w-4 h-4 text-rose-400" />,
      highlight: true,
      onClick: () => onNavigate('no-website'),
    },
    {
      title: 'С сайтом',
      value: stats?.hasWebsite || 0,
      sub: 'Действующие домены',
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      onClick: () => onNavigate('has-website'),
    },
    {
      title: 'Требуют проверки',
      value: (stats?.needsReview || 0) + (stats?.websiteInactive || 0),
      sub: `${stats?.websiteInactive || 0} нерабочих сайтов`,
      icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
      onClick: () => onNavigate('needs-review'),
    },
    {
      title: 'Найдено телефонов',
      value: stats?.phonesFound || 0,
      sub: 'Готовы к прозвону',
      icon: <Phone className="w-4 h-4 text-zinc-300" />,
      onClick: () => onNavigate('contacts'),
    },
    {
      title: 'WhatsApp-контакты',
      value: stats?.whatsappFound || 0,
      sub: 'Прямые чаты wa.me',
      icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
      onClick: () => onNavigate('contacts'),
    },
    {
      title: 'Связь через Telegram',
      value: (stats?.telegramFound || 0) + (stats?.telegramDirectFound || 0),
      sub: `${stats?.telegramChannelsFound || stats?.telegramFound || 0} каналов / ${stats?.telegramDirectFound || 0} чатов`,
      icon: <Send className="w-4 h-4 text-sky-400" />,
      onClick: () => onNavigate('contacts'),
    },
    {
      title: 'Новых за сегодня',
      value: stats?.newToday || 0,
      sub: 'Свежее сканирование',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      onClick: () => onNavigate('all-leads'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action */}
      <div className="p-6 rounded-xl bg-[#111111] border border-white/8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Городская система лидогенерации Брянск
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Поиск брянских предприятий без собственного сайта
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed">
              Анализ реестров по 4 районам города (Советский, Бежицкий, Володарский, Фокинский), выявление
              организаций с одними соцсетями или без веб-ресурса, скоринг потенциала и прямые контакты для веб-студии.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenExport}
              className="flex items-center gap-2 px-3.5 h-10 rounded-lg bg-[#181818] border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Экспорт XLSX</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Сканировать Брянск</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Scan Progress Widget */}
      {scanState?.isScanning && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-semibold text-white">
                Сканирование: {scanState.currentCategory} ({scanState.currentDistrict})
              </span>
            </div>
            <span className="font-mono text-xs text-zinc-300 font-semibold">{scanState.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 rounded-full"
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
                ? 'border-white/25 shadow-[0_0_15px_rgba(255,255,255,0.04)]'
                : 'border-white/8'
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

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* District Breakdown */}
        <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-4">
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
                        className="h-full bg-white/60 rounded-full"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Lead Potential Breakdown */}
        <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-4">
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
        <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-300" />
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                Воронка CRM в работе
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Статусы</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-zinc-400">Новые лиды</span>
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
              <span className="text-emerald-300 font-medium">Заинтересованы в сайте</span>
              <span className="font-mono text-emerald-300 font-bold">{stats?.byCrmStatus.INTERESTED || 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-white font-medium">Успешные клиенты</span>
              <span className="font-mono text-white font-bold">{stats?.byCrmStatus.CLIENT || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Discovered Leads Table */}
      <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-4">
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
              <tr className="border-b border-white/8 text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Название</th>
                <th className="py-2.5 px-3">Категория</th>
                <th className="py-2.5 px-3">Район / Адрес</th>
                <th className="py-2.5 px-3">Телефон / Мессенджер</th>
                <th className="py-2.5 px-3">Статус сайта</th>
                <th className="py-2.5 px-3">Потенциал</th>
                <th className="py-2.5 px-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLeads.slice(0, 7).map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white group-hover:underline">{lead.name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{lead.source}</div>
                  </td>
                  <td className="py-3 px-3 text-zinc-300">{lead.category}</td>
                  <td className="py-3 px-3">
                    <div className="text-zinc-200">{lead.district}</div>
                    <div className="text-[11px] text-zinc-500 truncate max-w-[200px]">{lead.address}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono text-zinc-200">{lead.formattedPhone || lead.phone || 'Не указан'}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lead.hasWhatsapp && (
                        <span className="text-[10px] text-emerald-400 font-mono">WA ✓</span>
                      )}
                      {Boolean(lead.telegram || lead.hasTelegramDirect) && (
                        <span className="text-[10px] text-sky-300 font-mono font-medium px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 shadow-[0_0_6px_rgba(56,189,248,0.2)]">
                          {lead.telegramType === 'channel' ? (lead.telegram || 'TG Канал') : '⚡ TG Чат'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                        lead.websiteStatus === 'NO_WEBSITE'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                          : lead.websiteStatus === 'SOCIAL_ONLY'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                          : lead.websiteStatus === 'HAS_WEBSITE'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {lead.websiteStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        lead.potential === 'HIGH'
                          ? 'text-rose-400'
                          : lead.potential === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {lead.potential}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[11px] border border-white/10 transition-colors"
                    >
                      Карточка
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
