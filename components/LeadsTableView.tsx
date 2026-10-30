/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

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
  ShieldCheck,
  Edit3,
  AlertTriangle,
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
} from '@/lib/types';
import { EditContactModal } from './EditContactModal';

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
  onOpenMessageGeneratorForLead?: (lead: BryanskLead) => void;
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
  onDeleteLead,
  onBatchDelete,
  onBatchFavorite,
  onBatchCrmStatus,
  onDeduplicate,
  onOpenExport,
  onOpenScanner,
  onOpenMessageGeneratorForLead,
  title,
  defaultWebsiteFilter,
  onlyFavorites = false,
  filterByMessengers = false,
}) => {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [websiteFilter, setWebsiteFilter] = useState<string>(defaultWebsiteFilter || 'all');
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>('all');
  const [potentialFilter, setPotentialFilter] = useState<string>('all');
  const [hasWhatsappOnly, setHasWhatsappOnly] = useState<boolean>(filterByMessengers);
  const [hasTelegramOnly, setHasTelegramOnly] = useState<boolean>(false);
  const [hasVkOnly, setHasVkOnly] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit contact modal state
  const [contactEditLead, setContactEditLead] = useState<BryanskLead | null>(null);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.city || 'Брянск'));
    return Array.from(set).sort();
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (onlyFavorites && !lead.isFavorite) return false;
      if (cityFilter !== 'all' && (lead.city || 'Брянск') !== cityFilter) return false;
      if (districtFilter !== 'all' && lead.district !== districtFilter) return false;
      if (categoryFilter !== 'all' && lead.category !== categoryFilter) return false;
      if (websiteFilter !== 'all' && lead.websiteStatus !== websiteFilter) return false;
      if (crmStatusFilter !== 'all' && lead.crmStatus !== crmStatusFilter) return false;
      if (potentialFilter !== 'all' && lead.potential !== potentialFilter) return false;
      if (hasWhatsappOnly && !lead.hasWhatsapp) return false;
      if (hasTelegramOnly && !(lead.telegram || lead.hasTelegramDirect)) return false;
      if (hasVkOnly && !lead.vk) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchCity = (lead.city || 'Брянск').toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q) || false;
        const matchAddress = lead.address.toLowerCase().includes(q);
        const matchCategory = lead.category.toLowerCase().includes(q);
        const matchTg = lead.telegram?.toLowerCase().includes(q) || false;
        const matchVk = lead.vk?.toLowerCase().includes(q) || false;

        if (!matchName && !matchCity && !matchPhone && !matchAddress && !matchCategory && !matchTg && !matchVk) {
          return false;
        }
      }
      return true;
    });
  }, [
    leads,
    onlyFavorites,
    cityFilter,
    districtFilter,
    categoryFilter,
    websiteFilter,
    crmStatusFilter,
    potentialFilter,
    hasWhatsappOnly,
    hasTelegramOnly,
    hasVkOnly,
    search,
  ]);

  // Handle Select All
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(phone);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleFavoriteToggle = (lead: BryanskLead, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLead(lead.id, { isFavorite: !lead.isFavorite });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Найдено: <strong className="text-white font-mono">{filteredLeads.length}</strong> из {leads.length} предприятий {cityFilter !== 'all' ? `(г. ${cityFilter})` : 'в базе'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onDeduplicate}
            title="Удалить дубликаты по номеру и адресу"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] text-zinc-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Дедупликация</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] text-zinc-300 text-xs font-medium border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Поиск организаций</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-3 rounded-xl bg-[#111111] border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию/городу/тел..."
              className="w-full bg-[#161616] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* City filter */}
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setDistrictFilter('all');
            }}
            className="bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            <option value="all">Все города ({availableCities.length})</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                г. {c}
              </option>
            ))}
          </select>

          {/* District filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Все районы</option>
            {(cityFilter === 'Брянск' || cityFilter === 'all' ? BRYANSK_DISTRICTS : []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            {cityFilter !== 'Брянск' && cityFilter !== 'all' && (
              <option value={`${cityFilter} (Центр / Район)`}>
                {cityFilter} (Центр / Район)
              </option>
            )}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Все категории ({BRYANSK_CATEGORIES.length})</option>
            {BRYANSK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Website filter */}
          <select
            value={websiteFilter}
            onChange={(e) => setWebsiteFilter(e.target.value)}
            className="bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Любой статус сайта</option>
            <option value="NO_WEBSITE">Без сайта (Горячие лиды)</option>
            <option value="SOCIAL_ONLY">Только соцсети (VK / TG)</option>
            <option value="HAS_WEBSITE">Есть сайт</option>
            <option value="DIRECTORY_ONLY">Только справочники (2GIS/Яндекс)</option>
            <option value="NEEDS_REVIEW">Требуют проверки</option>
          </select>

          {/* CRM status filter */}
          <select
            value={crmStatusFilter}
            onChange={(e) => setCrmStatusFilter(e.target.value)}
            className="bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Все статусы CRM</option>
            {Object.entries(CRM_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Messenger and quick filter chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setHasWhatsappOnly(!hasWhatsappOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                hasWhatsappOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setHasTelegramOnly(!hasTelegramOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                hasTelegramOnly
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>

            <button
              onClick={() => setHasVkOnly(!hasVkOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                hasVkOnly
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
              }`}
            >
              <span>VKontakte</span>
            </button>
          </div>

          {(search ||
            cityFilter !== 'all' ||
            districtFilter !== 'all' ||
            categoryFilter !== 'all' ||
            websiteFilter !== 'all' ||
            crmStatusFilter !== 'all' ||
            hasWhatsappOnly ||
            hasTelegramOnly ||
            hasVkOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setCityFilter('all');
                setDistrictFilter('all');
                setCategoryFilter('all');
                setWebsiteFilter('all');
                setCrmStatusFilter('all');
                setHasWhatsappOnly(false);
                setHasTelegramOnly(false);
                setHasVkOnly(false);
              }}
              className="text-[11px] text-zinc-400 hover:text-white"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300">
              Выбрано: {selectedIds.size} орг.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onBatchFavorite(Array.from(selectedIds), true)}
              className="px-2.5 py-1 rounded-lg bg-[#181818] border border-white/10 text-zinc-300 hover:text-white"
            >
              В избранное
            </button>

            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBatchCrmStatus(Array.from(selectedIds), e.target.value as CRMStatus);
                }
              }}
              defaultValue=""
              className="bg-[#181818] border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300"
            >
              <option value="" disabled>
                Изменить статус CRM...
              </option>
              {Object.entries(CRM_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => onBatchDelete(Array.from(selectedIds))}
              className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 hover:bg-rose-900/60"
            >
              Удалить выбранные
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="rounded-xl border border-white/10 bg-[#111111] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#141414] text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredLeads.length > 0 && selectedIds.size === filteredLeads.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400"
                  />
                </th>
                <th className="py-3 px-3 w-8">★</th>
                <th className="py-3 px-3">Предприятие</th>
                <th className="py-3 px-3">Район / Адрес</th>
                <th className="py-3 px-3">Контакты (WA / TG / VK)</th>
                <th className="py-3 px-3">Статус сайта</th>
                <th className="py-3 px-3">Потери/мес</th>
                <th className="py-3 px-3">Статус CRM</th>
                <th className="py-3 px-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <p className="text-sm font-medium">Ничего не найдено</p>
                    <p className="text-xs mt-1">Попробуйте изменить поисковый запрос или фильтры</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const webMeta = WEBSITE_STATUS_LABELS[lead.websiteStatus];
                  const crmMeta = CRM_STATUS_LABELS[lead.crmStatus];

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className={`hover:bg-[#161616] transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(lead.id, e as any)}
                          className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400"
                        />
                      </td>

                      {/* Favorite Star */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleFavoriteToggle(lead, e)}
                          className={`p-1 rounded hover:bg-white/10 ${
                            lead.isFavorite ? 'text-amber-400' : 'text-zinc-600'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white truncate max-w-[200px]">
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span>{lead.category}</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-500">⭐ {lead.rating} ({lead.reviewsCount})</span>
                        </div>
                      </td>

                      {/* City, District & Address */}
                      <td className="py-3 px-3 text-zinc-300">
                        <div className="flex items-center gap-1.5 font-medium text-xs">
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono shrink-0">
                            {lead.city || 'Брянск'}
                          </span>
                          <span className="truncate max-w-[130px] text-zinc-200">{lead.district}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate max-w-[180px] mt-0.5">{lead.address}</div>
                      </td>

                      {/* Contact Badges: WA, TG, VK + Quick Edit */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Phone / WA */}
                          {lead.formattedPhone ? (
                            <button
                              onClick={(e) => handleCopyPhone(lead.formattedPhone!, e)}
                              title="Скопировать номер"
                              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-zinc-400" />
                              <span>{copiedId === lead.formattedPhone ? 'Скопировано!' : lead.formattedPhone}</span>
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">Без тел.</span>
                          )}

                          {lead.hasWhatsapp && (
                            <a
                              href={`https://wa.me/${lead.whatsappPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Открыть чат WhatsApp"
                              className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Telegram */}
                          {(lead.telegram || lead.hasTelegramDirect) && (
                            <a
                              href={lead.telegramUrl || `https://t.me/${lead.telegram?.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title={`Telegram: ${lead.telegram} ${lead.isTgVerified ? '(Проверен)' : '(Авто)'}`}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                                lead.isTgVerified
                                  ? 'bg-sky-500/20 text-sky-200 border-sky-400 font-semibold'
                                  : 'bg-sky-500/10 text-sky-300 border-sky-500/25'
                              }`}
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>TG</span>
                              {lead.isTgVerified && <ShieldCheck className="w-2.5 h-2.5 text-sky-300" />}
                            </a>
                          )}

                          {/* VKontakte */}
                          {lead.vk && (
                            <a
                              href={lead.vk}
                              target="_blank"
                              rel="noreferrer"
                              title={`ВКонтакте: ${lead.vk} ${lead.isVkVerified ? '(Проверен)' : ''}`}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                                lead.isVkVerified
                                  ? 'bg-blue-500/20 text-blue-200 border-blue-400 font-semibold'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                              }`}
                            >
                              <span>VK</span>
                              {lead.isVkVerified && <ShieldCheck className="w-2.5 h-2.5 text-blue-300" />}
                            </a>
                          )}

                          {/* Edit TG / VK tool button */}
                          <button
                            onClick={() => setContactEditLead(lead)}
                            title="Исправить или проверить TG / VK"
                            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Website Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${webMeta.bg} ${webMeta.text}`}
                        >
                          {webMeta.label}
                        </span>
                      </td>

                      {/* Estimated Loss */}
                      <td className="py-3 px-3 font-mono text-zinc-200 text-xs">
                        {lead.estimatedLossMonthly
                          ? `${lead.estimatedLossMonthly.toLocaleString('ru-RU')} ₽`
                          : '—'}
                      </td>

                      {/* CRM Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${crmMeta.color} ${crmMeta.border}`}
                        >
                          {crmMeta.label}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (onOpenMessageGeneratorForLead) {
                                onOpenMessageGeneratorForLead(lead);
                              }
                            }}
                            title="Сгенерировать коммерческое сообщение от Даниила (FORM STUDIO)"
                            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Оффер</span>
                          </button>

                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            title="Удалить"
                            className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Contact Modal */}
      <EditContactModal
        lead={contactEditLead}
        isOpen={Boolean(contactEditLead)}
        onClose={() => setContactEditLead(null)}
        onUpdateLead={onUpdateLead}
      />
    </div>
  );
};
