/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Phone,
  MessageSquare,
  Send,
  ExternalLink,
  ChevronDown,
  Trash2,
  Download,
  Sparkles,
  Layers,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  BryanskLead,
  District,
  BRYANSK_DISTRICTS,
  BRYANSK_CATEGORIES,
  CRM_STATUS_LABELS,
  WEBSITE_STATUS_LABELS,
  CRMStatus,
  WebsiteStatus,
  LeadPotential,
} from '../types';

interface LeadsTableViewProps {
  leads: BryanskLead[];
  onSelectLead: (lead: BryanskLead) => void;
  onUpdateLead: (id: string, updates: Partial<BryanskLead>) => void;
  onDeleteLead: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchFavorite: (ids: string[], isFavorite: boolean) => void;
  onBatchCrmStatus: (ids: string[], status: CRMStatus) => void;
  onDeduplicate: () => void;
  onOpenExport: () => void;
  onOpenScanner: () => void;
  title: string;
  defaultWebsiteFilter?: WebsiteStatus;
  onlyFavorites?: boolean;
  onFindTelegram?: (id: string) => Promise<void>;
  onBatchFindTelegram?: (ids: string[]) => Promise<void>;
  filterByMessengers?: boolean;
}

export const LeadsTableView: React.FC<LeadsTableViewProps> = ({
  leads,
  onSelectLead,
  onUpdateLead,
  onBatchDelete,
  onBatchFavorite,
  onBatchCrmStatus,
  onDeduplicate,
  onOpenExport,
  onOpenScanner,
  onFindTelegram,
  onBatchFindTelegram,
  title,
  defaultWebsiteFilter,
  onlyFavorites = false,
  filterByMessengers = false,
}) => {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [websiteFilter, setWebsiteFilter] = useState<string>(defaultWebsiteFilter || 'all');
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>('all');
  const [potentialFilter, setPotentialFilter] = useState<string>('all');
  const [hasWhatsappOnly, setHasWhatsappOnly] = useState<boolean>(filterByMessengers);
  const [hasTelegramOnly, setHasTelegramOnly] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchingTgId, setSearchingTgId] = useState<string | null>(null);
  const [isBatchSearchingTg, setIsBatchSearchingTg] = useState(false);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (onlyFavorites && !lead.isFavorite) return false;
      if (districtFilter !== 'all' && lead.district !== districtFilter) return false;
      if (categoryFilter !== 'all' && lead.category !== categoryFilter) return false;
      if (websiteFilter !== 'all' && lead.websiteStatus !== websiteFilter) return false;
      if (crmStatusFilter !== 'all' && lead.crmStatus !== crmStatusFilter) return false;
      if (potentialFilter !== 'all' && lead.potential !== potentialFilter) return false;
      if (hasWhatsappOnly && !lead.hasWhatsapp) return false;
      if (hasTelegramOnly && !(lead.telegram || lead.hasTelegramDirect)) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q) || false;
        const matchAddress = lead.address.toLowerCase().includes(q);
        const matchCategory = lead.category.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddress && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [
    leads,
    onlyFavorites,
    districtFilter,
    categoryFilter,
    websiteFilter,
    crmStatusFilter,
    potentialFilter,
    hasWhatsappOnly,
    hasTelegramOnly,
    search,
  ]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const copyToClipboard = (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    } catch {
      fallbackCopy(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fallbackCopy = (text: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
              {filteredLeads.length} из {leads.length}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            База организаций Брянска с верификацией веб-сайтов и контактов
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDeduplicate}
            title="Поиск и удаление дубликатов по номеру телефона и адресу"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#111111] border border-white/8 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Дедупликация</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#111111] border border-white/8 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Найти ещё</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-xl bg-[#111111] border border-white/8 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск в таблице..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#181818] border border-white/8 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25"
            />
          </div>

          {/* District filter */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#181818] border border-white/8 text-xs text-zinc-300 focus:outline-none focus:border-white/25"
            >
              <option value="all">Все районы Брянска</option>
              {BRYANSK_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#181818] border border-white/8 text-xs text-zinc-300 focus:outline-none focus:border-white/25"
            >
              <option value="all">Все категории ({BRYANSK_CATEGORIES.length})</option>
              {BRYANSK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Website status filter */}
          <div>
            <select
              value={websiteFilter}
              onChange={(e) => setWebsiteFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#181818] border border-white/8 text-xs text-zinc-300 focus:outline-none focus:border-white/25"
            >
              <option value="all">Статус сайта: Все</option>
              <option value="NO_WEBSITE">NO WEBSITE (Без сайта)</option>
              <option value="SOCIAL_ONLY">SOCIAL ONLY (Только соцсети)</option>
              <option value="DIRECTORY_ONLY">DIRECTORY ONLY (Справочники)</option>
              <option value="HAS_WEBSITE">HAS WEBSITE (Есть сайт)</option>
              <option value="NEEDS_REVIEW">NEEDS REVIEW (Проверка)</option>
              <option value="WEBSITE_INACTIVE">WEBSITE INACTIVE (Не работает)</option>
            </select>
          </div>

          {/* Potential filter */}
          <div>
            <select
              value={potentialFilter}
              onChange={(e) => setPotentialFilter(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-[#181818] border border-white/8 text-xs text-zinc-300 focus:outline-none focus:border-white/25"
            >
              <option value="all">Потенциал: Все</option>
              <option value="HIGH">HIGH (Высокий)</option>
              <option value="MEDIUM">MEDIUM (Средний)</option>
              <option value="LOW">LOW (Низкий)</option>
            </select>
          </div>
        </div>

        {/* Secondary quick checkboxes and reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setHasTelegramOnly(!hasTelegramOnly)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                hasTelegramOnly
                  ? 'bg-sky-500 text-black font-semibold shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                  : 'bg-sky-950/40 border border-sky-800/40 text-sky-300 hover:bg-sky-900/40'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>⚡ Связь через Telegram ({leads.filter((l) => Boolean(l.telegram || l.hasTelegramDirect)).length})</span>
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={hasWhatsappOnly}
                onChange={(e) => setHasWhatsappOnly(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
              />
              <span>Только с WhatsApp</span>
            </label>

            <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
              <span>CRM Статус:</span>
              <select
                value={crmStatusFilter}
                onChange={(e) => setCrmStatusFilter(e.target.value)}
                className="h-6 px-1.5 rounded bg-[#181818] border border-white/8 text-[11px] text-zinc-300 focus:outline-none"
              >
                <option value="all">Все статусы</option>
                {Object.entries(CRM_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(search ||
            districtFilter !== 'all' ||
            categoryFilter !== 'all' ||
            websiteFilter !== 'all' ||
            crmStatusFilter !== 'all' ||
            potentialFilter !== 'all' ||
            hasWhatsappOnly ||
            hasTelegramOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setDistrictFilter('all');
                setCategoryFilter('all');
                setWebsiteFilter('all');
                setCrmStatusFilter('all');
                setPotentialFilter('all');
                setHasWhatsappOnly(false);
                setHasTelegramOnly(false);
              }}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить фильтры</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-white/20 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-white">
            <span className="font-semibold">{selectedIds.size}</span>
            <span className="text-zinc-400">организаций выбрано</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onBatchFindTelegram && (
              <button
                onClick={async () => {
                  setIsBatchSearchingTg(true);
                  try {
                    await onBatchFindTelegram(Array.from(selectedIds));
                  } finally {
                    setIsBatchSearchingTg(false);
                  }
                }}
                disabled={isBatchSearchingTg}
                className="px-2.5 py-1.5 rounded-lg bg-sky-950/70 hover:bg-sky-900/70 text-sky-200 text-xs border border-sky-700/50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>{isBatchSearchingTg ? 'Поиск TG...' : '⚡ Найти Telegram'}</span>
              </button>
            )}

            <button
              onClick={() => onBatchFavorite(Array.from(selectedIds), true)}
              className="px-2.5 py-1.5 rounded-lg bg-[#111111] hover:bg-white/10 text-white text-xs border border-white/10 flex items-center gap-1"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>В избранное</span>
            </button>

            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBatchCrmStatus(Array.from(selectedIds), e.target.value as CRMStatus);
                  e.target.value = '';
                }
              }}
              className="h-7 px-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="">Сменить CRM статус...</option>
              {Object.entries(CRM_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (confirm(`Удалить выбранные ${selectedIds.size} предприятий?`)) {
                  onBatchDelete(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs border border-rose-800/40 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-xl bg-[#111111] border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/8 bg-[#0c0c0c] text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredLeads.length > 0 && selectedIds.size === filteredLeads.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                  />
                </th>
                <th className="py-3 px-3 w-8">★</th>
                <th className="py-3 px-3 min-w-[200px]">Название / Категория</th>
                <th className="py-3 px-3 min-w-[160px]">Район / Адрес</th>
                <th className="py-3 px-3 min-w-[150px]">Телефон</th>
                <th className="py-3 px-3 min-w-[140px]">Telegram / WA</th>
                <th className="py-3 px-3 min-w-[140px]">Статус сайта</th>
                <th className="py-3 px-3 min-w-[90px]">Потенциал</th>
                <th className="py-3 px-3 min-w-[140px]">Статус CRM</th>
                <th className="py-3 px-3 min-w-[90px]">Отзывы</th>
                <th className="py-3 px-3 text-right min-w-[100px]">Карточка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-zinc-500">
                    <p className="text-sm text-zinc-400">Предприятий по заданным критериям не найдено.</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      Попробуйте сбросить фильтры или запустите новый сбор предприятий Брянска.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const webBadge = WEBSITE_STATUS_LABELS[lead.websiteStatus] || {
                    label: lead.websiteStatus,
                    bg: 'bg-zinc-800 border-zinc-700',
                    text: 'text-zinc-300',
                  };
                  const crmBadge = CRM_STATUS_LABELS[lead.crmStatus] || {
                    label: lead.crmStatus,
                    color: 'bg-zinc-800 text-zinc-300',
                    border: 'border-zinc-700',
                  };

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(lead.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                        />
                      </td>

                      {/* Favorite star */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLead(lead.id, { isFavorite: !lead.isFavorite });
                        }}
                      >
                        <button className="text-zinc-600 hover:text-amber-400 transition-colors">
                          <Star
                            className={`w-3.5 h-3.5 ${
                              lead.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white group-hover:underline">{lead.name}</span>
                          {Boolean(lead.telegram || lead.hasTelegramDirect) && (
                            <span
                              title={
                                lead.telegramType === 'channel'
                                  ? 'Официальный подтвержденный Telegram-канал'
                                  : 'Прямая связь в Telegram по мобильному номеру'
                              }
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/50 inline-flex items-center gap-1 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
                            >
                              <Send className="w-2.5 h-2.5 text-sky-300" />
                              <span>TG {lead.telegramType === 'channel' ? 'Канал' : 'Чат'}</span>
                            </span>
                          )}
                          {lead.inn && (
                            <span className="text-[10px] text-zinc-500 font-mono">ИНН {lead.inn}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">{lead.category}</div>
                      </td>

                      {/* Address & District */}
                      <td className="py-3 px-3">
                        <div className="text-zinc-200 font-medium">{lead.district}</div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                          {lead.address}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        {lead.phone ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="font-mono text-zinc-200 hover:text-white hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-zinc-400" />
                              <span>{lead.formattedPhone || lead.phone}</span>
                            </a>
                            <button
                              onClick={() => copyToClipboard(lead.phone!, lead.id)}
                              title="Скопировать телефон"
                              className="text-zinc-500 hover:text-zinc-300"
                            >
                              {copiedId === lead.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-mono">Не найден</span>
                        )}
                      </td>

                      {/* Telegram & WhatsApp */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1.5">
                          {/* WhatsApp */}
                          {lead.hasWhatsapp && lead.whatsappPhone ? (
                            <a
                              href={`https://wa.me/${lead.whatsappPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Открыть WhatsApp чат"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono hover:bg-emerald-900/60 w-fit"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WA ✓</span>
                            </a>
                          ) : (
                            <span className="text-zinc-700 text-[10px] font-mono">no-wa</span>
                          )}

                          {/* Telegram: Distinct, prominent highlight */}
                          {Boolean(lead.telegram || lead.hasTelegramDirect) ? (
                            <a
                              href={
                                lead.telegramUrl ||
                                (lead.telegram?.startsWith('@')
                                  ? `https://t.me/${lead.telegram.replace('@', '')}`
                                  : `https://t.me/+${lead.phone?.replace(/[^0-9]/g, '')}`)
                              }
                              target="_blank"
                              rel="noreferrer"
                              title={
                                lead.telegramType === 'channel'
                                  ? `Официальный канал: ${lead.telegram}`
                                  : `Прямой диалог в Telegram: ${lead.telegram || lead.phone}`
                              }
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/25 text-sky-200 border border-sky-400/50 text-[10px] font-mono font-semibold hover:bg-sky-500/35 shadow-[0_0_8px_rgba(56,189,248,0.3)] w-fit truncate max-w-[130px]"
                            >
                              <Send className="w-2.5 h-2.5 text-sky-300 shrink-0" />
                              <span className="truncate">{lead.telegramType === 'channel' ? lead.telegram : 'TG Чат'}</span>
                            </a>
                          ) : onFindTelegram ? (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setSearchingTgId(lead.id);
                                try {
                                  await onFindTelegram(lead.id);
                                } finally {
                                  setSearchingTgId(null);
                                }
                              }}
                              disabled={searchingTgId === lead.id}
                              className="text-zinc-500 hover:text-sky-300 text-[10px] font-mono hover:underline flex items-center gap-1 text-left w-fit"
                            >
                              <span>{searchingTgId === lead.id ? 'Поиск...' : '+ Найти TG'}</span>
                            </button>
                          ) : (
                            <span className="text-zinc-700 text-[10px] font-mono">no-tg</span>
                          )}
                        </div>
                      </td>

                      {/* Website status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${webBadge.bg} ${webBadge.text}`}
                        >
                          {webBadge.label}
                        </span>
                        {lead.website && (
                          <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px] mt-0.5">
                            {lead.website.replace(/^https?:\/\//, '')}
                          </div>
                        )}
                        {lead.vk && !lead.website && (
                          <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px] mt-0.5">
                            vk: {lead.vk.replace(/^https?:\/\/vk\.com\//, '')}
                          </div>
                        )}
                      </td>

                      {/* Potential */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-mono font-bold ${
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

                      {/* CRM Status Dropdown */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.crmStatus}
                          onChange={(e) =>
                            onUpdateLead(lead.id, { crmStatus: e.target.value as CRMStatus })
                          }
                          className={`h-6 px-1.5 rounded text-[11px] font-medium border focus:outline-none ${crmBadge.color} ${crmBadge.border}`}
                        >
                          {Object.entries(CRM_STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k} className="bg-zinc-900 text-white">
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Reviews / Rating */}
                      <td className="py-3 px-3 font-mono text-zinc-300">
                        <div>★ {lead.rating}</div>
                        <div className="text-[10px] text-zinc-500">
                          {lead.reviewsCount} отзывов
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[11px] border border-white/10 transition-colors"
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
