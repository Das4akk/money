/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  MessageSquare,
  Phone,
  FileText,
  AlertTriangle,
  TrendingDown,
  Clock,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  Building,
  MapPin,
  RefreshCw,
  Info,
  Sliders,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import {
  BryanskLead,
  MessageChannel,
  MessageAngle,
  District,
  AppSettings,
  POPULAR_CITIES,
} from '@/lib/types';
import { calculateLostProfitAudit } from '@/lib/leadLogic';

interface MessageGeneratorViewProps {
  leads: BryanskLead[];
  initialLeadId?: string;
  settings?: AppSettings | null;
  onUpdateLead?: (id: string, updates: Partial<BryanskLead>) => void;
  onAddInteraction?: (id: string, log: { type: any; text: string; author: string }) => void;
}

export const MessageGeneratorView: React.FC<MessageGeneratorViewProps> = ({
  leads,
  initialLeadId,
  settings,
  onUpdateLead,
  onAddInteraction,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || (leads[0]?.id || 'custom'));
  const [searchLeadQuery, setSearchLeadQuery] = useState('');

  // Custom manual lead fields (if leadId === 'custom')
  const [customName, setCustomName] = useState('');
  const [customCity, setCustomCity] = useState('Брянск');
  const [customCategory, setCustomCategory] = useState('Автосервисы');
  const [customDistrict, setCustomDistrict] = useState<District>('Советский район');
  const [customPhone, setCustomPhone] = useState('');
  const [customVk, setCustomVk] = useState('');
  const [customTg, setCustomTg] = useState('');

  // Generation options
  const [channel, setChannel] = useState<MessageChannel>('whatsapp');
  const [angle, setAngle] = useState<MessageAngle>('profit_and_booking');
  const [emphasizeBookingBarrier, setEmphasizeBookingBarrier] = useState(true);
  const [senderName, setSenderName] = useState(settings?.senderName || 'Даниил');
  const [companyName, setCompanyName] = useState(settings?.companyName || 'FORM STUDIO');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [generationSource, setGenerationSource] = useState<'gemini' | 'form_studio_engine' | null>(null);
  const [history, setHistory] = useState<{ id: string; title: string; text: string; channel: string; timestamp: string }[]>([]);
  const [crmLogNotice, setCrmLogNotice] = useState<string | null>(null);

  // Sync settings when available
  useEffect(() => {
    if (settings?.senderName) setSenderName(settings.senderName);
    if (settings?.companyName) setCompanyName(settings.companyName);
  }, [settings]);

  // Sync initial lead
  useEffect(() => {
    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
    }
  }, [initialLeadId]);

  const activeLead = useMemo(() => {
    if (selectedLeadId === 'custom') return null;
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  // Derived current target properties
  const targetName = activeLead ? activeLead.name : customName || 'Название организации';
  const targetCity = activeLead ? (activeLead.city || 'Брянск') : (customCity || 'Брянск');
  const targetCategory = activeLead ? activeLead.category : customCategory;
  const targetDistrict = activeLead ? activeLead.district : customDistrict;
  const targetPhone = activeLead ? (activeLead.phone || activeLead.formattedPhone) : customPhone;
  const targetVk = activeLead ? activeLead.vk : customVk;
  const targetTg = activeLead ? activeLead.telegram : customTg;

  // Real-time lost profit audit
  const audit = useMemo(() => {
    return calculateLostProfitAudit({
      category: targetCategory,
      district: targetDistrict,
      name: targetName,
      city: targetCity,
    });
  }, [targetCategory, targetDistrict, targetName, targetCity]);

  // Filtered leads for selector
  const filteredLeads = useMemo(() => {
    if (!searchLeadQuery.trim()) return leads.slice(0, 30);
    const q = searchLeadQuery.toLowerCase().trim();
    return leads.filter((l) =>
      l.name.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.district.toLowerCase().includes(q)
    );
  }, [leads, searchLeadQuery]);

  // Generate Message Handler
  const handleGenerate = async (forceEngine = false) => {
    setIsGenerating(true);
    setCrmLogNotice(null);

    try {
      const payload: any = {
        channel,
        angle,
        emphasizeBookingBarrier,
        senderName,
        companyName,
      };

      if (selectedLeadId !== 'custom' && activeLead) {
        payload.leadId = activeLead.id;
      } else {
        payload.customLead = {
          name: customName || 'Организация',
          city: customCity || 'Брянск',
          category: customCategory,
          district: customDistrict,
          phone: customPhone,
          vk: customVk,
          telegram: customTg,
        };
      }

      if (forceEngine) {
        payload.forceEngine = true;
      }

      const res = await fetch('/api/leads/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.pitchText) {
        setGeneratedText(data.pitchText);
        setGenerationSource(data.source || 'gemini');

        // Add to history
        setHistory((prev) => [
          {
            id: `hist-${Date.now()}`,
            title: `${targetName} · ${channel.toUpperCase()}`,
            text: data.pitchText,
            channel,
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      console.error('Error generating pitch:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run initial generation on load
  useEffect(() => {
    if (!generatedText) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Log to CRM & Open direct messenger
  const handleSendViaMessenger = (targetChannel: 'whatsapp' | 'telegram' | 'vk') => {
    if (!generatedText) return;

    if (activeLead && onUpdateLead) {
      const statusMap: Record<string, any> = {
        whatsapp: 'CONTACTED_WA',
        telegram: 'CONTACTED_TG',
        vk: 'CONTACTED_VK',
      };
      onUpdateLead(activeLead.id, { crmStatus: statusMap[targetChannel] || 'AWAITING_REPLY' });

      if (onAddInteraction) {
        onAddInteraction(activeLead.id, {
          type: targetChannel,
          text: `Отправлено коммерческое сообщение от ${senderName} (${companyName}):\n${generatedText.slice(0, 160)}...`,
          author: senderName,
        });
      }

      setCrmLogNotice(`Статус лида обновлен на «${statusMap[targetChannel]}» и зафиксирован в CRM`);
    }

    // Direct opening links
    if (targetChannel === 'whatsapp') {
      const cleanDigits = targetPhone?.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(generatedText);
      const url = cleanDigits
        ? `https://wa.me/${cleanDigits}?text=${encodedMsg}`
        : `https://wa.me/?text=${encodedMsg}`;
      window.open(url, '_blank');
    } else if (targetChannel === 'telegram') {
      const cleanTg = targetTg?.startsWith('@') ? targetTg.substring(1) : targetTg;
      if (cleanTg) {
        window.open(`https://t.me/${cleanTg}`, '_blank');
      } else if (targetPhone && targetPhone.startsWith('+79')) {
        const digits = targetPhone.replace(/[^0-9]/g, '');
        window.open(`https://t.me/+${digits}`, '_blank');
      } else {
        handleCopy();
      }
    } else if (targetChannel === 'vk') {
      if (targetVk) {
        window.open(targetVk, '_blank');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Introduction */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121212] via-[#161616] to-[#1c1917] border border-amber-500/20 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                FORM STUDIO OUTREACH ENGINE
              </span>
              <span className="text-xs text-zinc-400">Автор: <strong className="text-white font-medium">{senderName}</strong></span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Генератор конверсионных предложений для бизнеса Брянска
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
              Создание персонализированных сообщений для компаний без сайта. Встроенный расчет упущенной прибыли,
              аргументация барьера звонка (до 50% молчаливых клиентов) и оффер готового интерактивного макета от <strong className="text-amber-400">FORM STUDIO</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => handleGenerate(false)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Генерация...' : 'Сгенерировать AI'}</span>
            </button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Target Enterprise Selector */}
          <div className="p-4 rounded-xl bg-[#111111] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>1. Выбор организации</span>
              </label>
              <button
                onClick={() => setSelectedLeadId('custom')}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  selectedLeadId === 'custom'
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white bg-white/5'
                }`}
              >
                + Своя организация
              </button>
            </div>

            {selectedLeadId !== 'custom' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchLeadQuery}
                    onChange={(e) => setSearchLeadQuery(e.target.value)}
                    placeholder="Поиск по названию или району..."
                    className="w-full bg-[#181818] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLeadId === lead.id;
                    return (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 text-white'
                            : 'bg-[#161616] border-white/5 text-zinc-300 hover:bg-[#1a1a1a] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate">{lead.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            lead.websiteStatus === 'NO_WEBSITE'
                              ? 'bg-rose-950/70 text-rose-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {lead.websiteStatus === 'NO_WEBSITE' ? 'Без сайта' : 'Есть сайт'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                          <span>{lead.category}</span>
                          <span>•</span>
                          <span>{lead.district}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom organization inputs */
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Название предприятия</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Например: Автотехцентр Премиум 32"
                    className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Город</label>
                    <div className="flex gap-1.5">
                      <select
                        value={POPULAR_CITIES.includes(customCity) ? customCity : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') setCustomCity(e.target.value);
                          else setCustomCity('');
                        }}
                        className="w-1/2 bg-[#181818] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {POPULAR_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="custom">Другой город...</option>
                      </select>
                      <input
                        type="text"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        placeholder="Название города"
                        className="w-1/2 bg-[#181818] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Район / Локация</label>
                    <input
                      type="text"
                      value={customDistrict}
                      onChange={(e) => setCustomDistrict(e.target.value)}
                      placeholder="Советский район / центр..."
                      className="w-full bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Сфера деятельности</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Автосервисы">Автосервисы</option>
                    <option value="Стоматологии">Стоматологии</option>
                    <option value="Салоны красоты">Салоны красоты</option>
                    <option value="Мебельные производства">Мебельные производства</option>
                    <option value="Строительные компании">Строительные компании</option>
                    <option value="Ремонт квартир">Ремонт квартир</option>
                    <option value="Натяжные потолки">Натяжные потолки</option>
                    <option value="Кафе и рестораны">Кафе и рестораны</option>
                    <option value="Другие услуги">Другие услуги</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Телефон / WA</label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="+79..."
                      className="w-full bg-[#181818] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Telegram</label>
                    <input
                      type="text"
                      value={customTg}
                      onChange={(e) => setCustomTg(e.target.value)}
                      placeholder="@handle"
                      className="w-full bg-[#181818] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Группа VK</label>
                    <input
                      type="text"
                      value={customVk}
                      onChange={(e) => setCustomVk(e.target.value)}
                      placeholder="vk.com/..."
                      className="w-full bg-[#181818] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Channel & Style Selector */}
          <div className="p-4 rounded-xl bg-[#111111] border border-white/10 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>2. Канал коммуникации</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setChannel('whatsapp')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                      : 'bg-[#181818] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => setChannel('telegram')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'telegram'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-semibold'
                      : 'bg-[#181818] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </button>

                <button
                  onClick={() => setChannel('vk')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'vk'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-semibold'
                      : 'bg-[#181818] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>ВКонтакте</span>
                </button>

                <button
                  onClick={() => setChannel('call_script')}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'call_script'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                      : 'bg-[#181818] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Звонок (Скрипт)</span>
                </button>

                <button
                  onClick={() => setChannel('proposal')}
                  className={`col-span-2 py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    channel === 'proposal'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-semibold'
                      : 'bg-[#181818] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>КП / Развернутый аудит</span>
                </button>
              </div>
            </div>

            {/* Pitch Angle */}
            <div>
              <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>3. Формула и акцент оффера</span>
              </label>

              <div className="space-y-1.5">
                {[
                  {
                    id: 'profit_and_booking' as MessageAngle,
                    title: 'Упущенная прибыль + Фактор молчаливых клиентов',
                    badge: 'Рекомендуется',
                    desc: 'Жесткая связка: цифры потерь в Брянске + почему клиенты боятся звонить и уходят.',
                  },
                  {
                    id: 'short_hook' as MessageAngle,
                    title: 'Короткий пробивной контакт (2-3 абзаца)',
                    desc: 'Идеально для WhatsApp/Telegram, чтобы сразу получить ответ «Давайте взглянем».',
                  },
                  {
                    id: 'free_concept' as MessageAngle,
                    title: 'Оффер готового интерактивного макета',
                    desc: '«Мы уже собрали макет сайта для вашей ниши в Брянске, прислать ссылку?»',
                  },
                  {
                    id: 'audit_losses' as MessageAngle,
                    title: 'Провокационный аудит слабых мест',
                    desc: 'Разбор, почему конкуренты в районе забирают все заявки из Яндекса.',
                  },
                ].map((item) => {
                  const isSelected = angle === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAngle(item.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-white'
                          : 'bg-[#161616] border-white/5 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-amber-500/20 text-amber-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Toggle for the Silent Customer Booking Barrier */}
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emphasizeBookingBarrier}
                  onChange={(e) => setEmphasizeBookingBarrier(e.target.checked)}
                  className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-400"
                />
                <div className="text-xs">
                  <span className="font-semibold text-amber-300 block">
                    Включить акцент на барьер звонка и онлайн-запись
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Подчеркивает, что людям психологически неудобно звонить голосом или долго списываться по поводу приема — из-за этого бизнес теряет до 50% трафика.
                  </p>
                </div>
              </label>
            </div>

            {/* Sender / Brand Info */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Имя отправителя</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Компания / Студия</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-medium text-amber-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Lost Profit Calculator Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#141414] to-[#181818] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Аудит потерь: {targetName}
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">г. {targetCity} ({targetDistrict})</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Потери в месяц</span>
                <span className="text-sm font-bold text-rose-400 font-mono">
                  {audit.monthlyLossMin.toLocaleString('ru-RU')} – {audit.monthlyLossMax.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-zinc-400 block">Утечка клиентов</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  ~{audit.lostCustomersPerMonth} чел. / мес
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Фактор «Молчаливых клиентов» (без онлайн-записи):</span>
                <span className="text-amber-400 font-bold">{audit.silentCustomersLossPercent}% утечки</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-1.5 rounded-full"
                  style={{ width: `${audit.silentCustomersLossPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 pt-0.5">
                Клиенты закрывают вкладку и уходят к конкурентам, если нельзя за 30 сек записаться без звонка.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Message Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-xl bg-[#111111] border border-white/10 flex flex-col h-full min-h-[580px]">
            {/* Header of Workspace */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white">Готовое сообщение для отправки</h3>
                {generationSource && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                    {generationSource === 'gemini' ? 'Gemini 3.8 Flash' : 'FORM STUDIO Engine'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  title="Мгновенный локальный шаблон FORM STUDIO"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Пересобрать</span>
                </button>

                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                    copied
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
                </button>
              </div>
            </div>

            {/* CRM Notification Banner */}
            {crmLogNotice && (
              <div className="my-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{crmLogNotice}</span>
              </div>
            )}

            {/* Main Text Area / Editor */}
            <div className="flex-1 py-4">
              <textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                placeholder="Здесь появится сгенерированное персонализированное предложение..."
                className="w-full h-full min-h-[360px] bg-[#0c0c0c] border border-white/10 rounded-xl p-4 text-xs md:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-sans leading-relaxed resize-none shadow-inner"
              />
            </div>

            {/* Quick Action Send Buttons */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Открыть в 1 клик:</span>
                <button
                  onClick={() => handleSendViaMessenger('whatsapp')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleSendViaMessenger('telegram')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </button>

                {targetVk && (
                  <button
                    onClick={() => handleSendViaMessenger('vk')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm"
                  >
                    <span>VKontakte</span>
                  </button>
                )}
              </div>

              {activeLead && (
                <div className="text-xs text-zinc-400">
                  Лид: <strong className="text-white">{activeLead.name}</strong>
                </div>
              )}
            </div>

            {/* History Drawer */}
            {history.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                  Недавние варианты сообщений ({history.length}):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setGeneratedText(h.text)}
                      className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222222] border border-white/5 text-[11px] text-zinc-300 whitespace-nowrap transition-colors"
                    >
                      {h.title} <span className="text-zinc-500 text-[10px]">({h.timestamp})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
