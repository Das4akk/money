/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Send,
  Globe,
  ExternalLink,
  Star,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Link as LinkIcon,
  Plus,
  Clock,
  ShieldCheck,
  Building,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  BryanskLead,
  CRM_STATUS_LABELS,
  WEBSITE_STATUS_LABELS,
  CRMStatus,
  LeadPotential,
  WebsiteStatus,
} from '../types';

interface LeadDetailModalProps {
  lead: BryanskLead | null;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<BryanskLead>) => void;
  onAddInteraction: (leadId: string, type: 'call' | 'whatsapp' | 'telegram' | 'meeting' | 'note', text: string) => void;
  onFindTelegram?: (id: string) => Promise<any> | void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onUpdateLead,
  onAddInteraction,
  onFindTelegram,
}) => {
  if (!lead) return null;

  const [notes, setNotes] = useState(lead.notes || '');
  const [nextContactDate, setNextContactDate] = useState(lead.nextContactDate || '');
  const [chatLink, setChatLink] = useState(lead.chatLink || '');
  const [isVerifyingSite, setIsVerifyingSite] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // Gemini Pitch state
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchContent, setPitchContent] = useState<string | null>(null);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Telegram deep search state
  const [isSearchingTg, setIsSearchingTg] = useState(false);
  const [tgFeedback, setTgFeedback] = useState<string | null>(null);
  const [isTgCopied, setIsTgCopied] = useState(false);

  // New interaction input state
  const [interactionType, setInteractionType] = useState<'call' | 'whatsapp' | 'telegram' | 'meeting' | 'note'>('call');
  const [interactionText, setInteractionText] = useState('');

  const handleFindTelegram = async () => {
    setIsSearchingTg(true);
    setTgFeedback(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/find-telegram`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.lead) {
        onUpdateLead(lead.id, data.lead);
        if (data.lead.telegram || data.lead.hasTelegramDirect) {
          setTgFeedback(
            data.lead.telegramType === 'channel'
              ? `Найден подтвержденный Telegram-канал: ${data.lead.telegram}`
              : `Определен прямой диалог Telegram по номеру: ${data.lead.telegram || data.lead.formattedPhone}`
          );
        } else {
          setTgFeedback('Новых Telegram-контактов в открытых источниках пока не обнаружено');
        }
      } else {
        setTgFeedback(data.error || 'Ошибка при сканировании');
      }
    } catch (e: any) {
      setTgFeedback(`Ошибка: ${e.message}`);
    } finally {
      setIsSearchingTg(false);
    }
  };

  const copyTelegramOutreach = () => {
    const text = `Здравствуйте! Меня зовут представитель агентства веб-разработки в Брянске. Обратил внимание на ваше предприятие "${lead.name}" (${lead.category}, ${lead.district}). Заметил, что у вас пока нет собственного сайта в Яндекс/Google, и клиенты уходят конкурентам. Можем подготовить для вас современный сайт с онлайн-заявками за 2-3 дня. Подскажите, с кем можно обсудить данный вопрос?`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
      } else {
        fallbackCopyText(text);
      }
    } catch {
      fallbackCopyText(text);
    }
    setIsTgCopied(true);
    setTimeout(() => setIsTgCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    onUpdateLead(lead.id, {
      notes,
      nextContactDate: nextContactDate || undefined,
      chatLink: chatLink || undefined,
    });
  };

  const handleVerifyWebsite = async () => {
    setIsVerifyingSite(true);
    setVerifyMessage(null);
    try {
      const targetUrl = lead.website || lead.vk || `https://yandex.ru/search/?text=${encodeURIComponent(lead.name + ' Брянск')}`;
      const res = await fetch('/api/verify-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, leadId: lead.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateLead(lead.id, {
          websiteStatus: data.status,
          lastCheckedDate: new Date().toISOString().split('T')[0],
        });
        setVerifyMessage(`Проверка завершена: статус "${data.status}". ${data.isAlive ? 'Ресурс доступен (HTTP 200)' : 'Сайт не отвечает'}`);
      } else {
        setVerifyMessage(`Ошибка: ${data.error}`);
      }
    } catch (e: any) {
      setVerifyMessage(`Ошибка запроса: ${e.message}`);
    } finally {
      setIsVerifyingSite(false);
    }
  };

  const handleGeneratePitch = async () => {
    setIsGeneratingPitch(true);
    setPitchError(null);
    setPitchContent(null);
    try {
      const res = await fetch('/api/ai/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          enterpriseName: lead.name,
          category: lead.category,
          district: lead.district,
          websiteStatus: lead.websiteStatus,
          phone: lead.phone,
          vk: lead.vk,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPitchContent(data.pitchText);
      } else {
        setPitchError(data.error || 'Не удалось сгенерировать КП');
      }
    } catch (err: any) {
      setPitchError(err.message || 'Ошибка соединения с сервером');
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionText.trim()) return;
    onAddInteraction(lead.id, interactionType, interactionText.trim());
    setInteractionText('');
  };

  const copyPitch = () => {
    if (!pitchContent) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pitchContent).catch(() => {
          fallbackCopyText(pitchContent);
        });
      } else {
        fallbackCopyText(pitchContent);
      }
    } catch {
      fallbackCopyText(pitchContent);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const fallbackCopyText = (text: string) => {
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

  const webBadge = WEBSITE_STATUS_LABELS[lead.websiteStatus] || {
    label: lead.websiteStatus,
    bg: 'bg-zinc-800 border-zinc-700',
    text: 'text-zinc-300',
    desc: '',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-white/8 flex items-start justify-between bg-[#0e0e0e] shrink-0">
          <div className="space-y-1 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                {lead.district}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                {lead.category}
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  lead.potential === 'HIGH'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                    : lead.potential === 'MEDIUM'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                Потенциал: {lead.potential}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{lead.name}</span>
              <button
                onClick={() => onUpdateLead(lead.id, { isFavorite: !lead.isFavorite })}
                className="text-zinc-500 hover:text-amber-400"
              >
                <Star className={`w-4 h-4 ${lead.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </h2>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>{lead.address}</span>
              {lead.sourceUrl && (
                <a
                  href={lead.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>({lead.source})</span>
                </a>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Contact Bar */}
          <div className="p-4 rounded-xl bg-[#161616] border border-white/8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {lead.phone ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-medium transition-colors border border-white/10"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lead.formattedPhone || lead.phone}</span>
                  </a>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">Телефон: Не указан</span>
              )}

              {lead.hasWhatsapp && lead.whatsappPhone ? (
                <a
                  href={`https://wa.me/${lead.whatsappPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-mono font-medium border border-emerald-700/50 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp (+{lead.whatsappPhone})</span>
                </a>
              ) : (
                <span className="text-xs text-zinc-600 font-mono">WhatsApp: —</span>
              )}

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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-xs font-mono font-semibold border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-sky-300" />
                  <span>
                    {lead.telegramType === 'channel'
                      ? `⚡ TG ${lead.telegram}`
                      : `⚡ TG Чат (+${lead.phone?.replace(/[^0-9]/g, '')})`}
                  </span>
                </a>
              ) : (
                <button
                  onClick={handleFindTelegram}
                  disabled={isSearchingTg}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-sky-950/40 text-zinc-400 hover:text-sky-300 text-xs font-mono border border-white/10 hover:border-sky-500/30 transition-colors"
                >
                  <Send className={`w-3.5 h-3.5 ${isSearchingTg ? 'animate-spin text-sky-400' : ''}`} />
                  <span>{isSearchingTg ? 'Сканирование TG...' : '+ Найти Telegram'}</span>
                </button>
              )}

              {lead.vk && (
                <a
                  href={lead.vk}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-200 text-xs font-mono font-medium border border-blue-700/50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ВКонтакте</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Рейтинг:</span>
              <span className="text-xs font-mono font-bold text-amber-400">★ {lead.rating}</span>
              <span className="text-[11px] text-zinc-500 font-mono">({lead.reviewsCount} отз.)</span>
            </div>
          </div>

          {/* Dedicated Telegram Outreach & Status Banner */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              Boolean(lead.telegram || lead.hasTelegramDirect)
                ? 'bg-gradient-to-r from-sky-950/30 via-[#131b24] to-[#111111] border-sky-500/40 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                : 'bg-[#141414] border-white/8'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    Boolean(lead.telegram || lead.hasTelegramDirect)
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                      : 'bg-white/5 text-zinc-400 border border-white/5'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold font-mono tracking-wider uppercase ${
                        Boolean(lead.telegram || lead.hasTelegramDirect) ? 'text-sky-300' : 'text-zinc-400'
                      }`}
                    >
                      {Boolean(lead.telegram || lead.hasTelegramDirect)
                        ? '⚡ Доступна связь через Telegram'
                        : 'Поиск Telegram для связи'}
                    </span>
                    {lead.telegramType && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60">
                        {lead.telegramType === 'channel' ? 'Официальный канал' : 'Прямой мобильный чат'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300">
                    {Boolean(lead.telegram || lead.hasTelegramDirect) ? (
                      lead.telegramType === 'channel' ? (
                        <span>
                          Канал организации:{' '}
                          <span className="font-mono text-white font-semibold">{lead.telegram}</span> (найден в
                          описании сообщества / на сайте)
                        </span>
                      ) : (
                        <span>
                          Прямой диалог по мобильному телефону:{' '}
                          <span className="font-mono text-white font-semibold">
                            {lead.formattedPhone || lead.phone}
                          </span>{' '}
                          (подтвержденный номер РФ)
                        </span>
                      )
                    ) : (
                      'Глубокий поиск проверяет публичные ссылки t.me в группе ВКонтакте, в коде сайта и валидирует прямой мобильный номер.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {Boolean(lead.telegram || lead.hasTelegramDirect) ? (
                  <>
                    <a
                      href={
                        lead.telegramUrl ||
                        (lead.telegram?.startsWith('@')
                          ? `https://t.me/${lead.telegram.replace('@', '')}`
                          : `https://t.me/+${lead.phone?.replace(/[^0-9]/g, '')}`)
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                    >
                      <Send className="w-3.5 h-3.5 fill-black" />
                      <span>Открыть чат TG</span>
                    </a>

                    <button
                      onClick={copyTelegramOutreach}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/10"
                    >
                      {isTgCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isTgCopied ? 'Скопировано!' : 'Скрипт для TG'}</span>
                    </button>

                    <button
                      onClick={handleFindTelegram}
                      disabled={isSearchingTg}
                      title="Повторный глубокий поиск"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSearchingTg ? 'animate-spin' : ''}`} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleFindTelegram}
                    disabled={isSearchingTg}
                    className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingTg ? 'animate-spin' : ''}`} />
                    <span>{isSearchingTg ? 'Идет глубокий скан...' : '🔍 Найти Telegram'}</span>
                  </button>
                )}
              </div>
            </div>

            {tgFeedback && (
              <div className="mt-3 p-2.5 rounded bg-black/60 border border-white/10 text-xs text-sky-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{tgFeedback}</span>
              </div>
            )}
          </div>

          {/* Grid: Left Column (Website & AI Pitch) | Right Column (CRM Pipeline & Logs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Website Audit & AI Outreach Pitch */}
            <div className="space-y-5">
              {/* Website Audit Card */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-300" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Аудит веб-присутствия
                    </h3>
                  </div>
                  <button
                    onClick={handleVerifyWebsite}
                    disabled={isVerifyingSite}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isVerifyingSite ? 'animate-spin' : ''}`} />
                    <span>Проверить live</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold border ${webBadge.bg} ${webBadge.text}`}
                  >
                    {webBadge.label}
                  </span>
                  <span className="text-xs text-zinc-400">{webBadge.desc}</span>
                </div>

                {lead.website && (
                  <div className="text-xs font-mono text-zinc-300 break-all p-2 rounded bg-black/40 border border-white/5">
                    URL: {lead.website}
                  </div>
                )}

                {verifyMessage && (
                  <div className="p-2.5 rounded bg-white/5 border border-white/10 text-xs text-zinc-300 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{verifyMessage}</span>
                  </div>
                )}

                <div className="text-[11px] text-zinc-500 font-mono pt-1">
                  Последняя дата проверки: {lead.lastCheckedDate || lead.foundDate}
                </div>
              </div>

              {/* Gemini AI Sales Proposal Generator */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      AI Генератор КП (Gemini 3.8)
                    </h3>
                  </div>
                  {pitchContent && (
                    <button
                      onClick={copyPitch}
                      className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Скопировано!' : 'Копировать'}</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Создает персонализированный скрипт звонка и сообщения в мессенджер с обоснованием упущенной прибыли без сайта в Брянске.
                </p>

                {!pitchContent && !isGeneratingPitch && (
                  <button
                    onClick={handleGeneratePitch}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Сгенерировать предложение</span>
                  </button>
                )}

                {isGeneratingPitch && (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                    <span className="text-xs font-mono">Анализ ниши и составление скрипта...</span>
                  </div>
                )}

                {pitchError && (
                  <div className="p-3 rounded bg-rose-950/60 border border-rose-800/40 text-xs text-rose-300">
                    {pitchError}
                  </div>
                )}

                {pitchContent && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-black/60 border border-white/8 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-sans">
                      {pitchContent}
                    </div>
                    <button
                      onClick={handleGeneratePitch}
                      className="w-full py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] border border-white/5 transition-colors"
                    >
                      Сгенерировать другой вариант
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: CRM Pipeline, Notes & Interaction Logs */}
            <div className="space-y-5">
              {/* CRM Pipeline Controls */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/8 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Управление статусом CRM
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">ID: {lead.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Статус контакта</label>
                    <select
                      value={lead.crmStatus}
                      onChange={(e) => onUpdateLead(lead.id, { crmStatus: e.target.value as CRMStatus })}
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none"
                    >
                      {Object.entries(CRM_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Приоритет (Потенциал)</label>
                    <select
                      value={lead.potential}
                      onChange={(e) => onUpdateLead(lead.id, { potential: e.target.value as LeadPotential })}
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none"
                    >
                      <option value="HIGH">HIGH (Высокий)</option>
                      <option value="MEDIUM">MEDIUM (Средний)</option>
                      <option value="LOW">LOW (Низкий)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Следующий контакт</label>
                    <input
                      type="date"
                      value={nextContactDate}
                      onChange={(e) => {
                        setNextContactDate(e.target.value);
                        onUpdateLead(lead.id, { nextContactDate: e.target.value });
                      }}
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Ссылка на переписку</label>
                    <input
                      type="text"
                      value={chatLink}
                      onChange={(e) => {
                        setChatLink(e.target.value);
                        onUpdateLead(lead.id, { chatLink: e.target.value });
                      }}
                      placeholder="https://t.me/... или wa"
                      className="w-full h-8 px-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Заметки по организации</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSaveNotes}
                    rows={3}
                    placeholder="Например: ЛПР Александр, интересовался квизом по мебели, созвон в четверг..."
                    className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveNotes}
                      className="text-[11px] text-zinc-400 hover:text-white"
                    >
                      Сохранить заметку
                    </button>
                  </div>
                </div>
              </div>

              {/* Interaction History / Timeline */}
              <div className="p-4 rounded-xl bg-[#141414] border border-white/8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-300" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      История взаимодействий ({lead.interactions?.length || 0})
                    </h3>
                  </div>
                </div>

                {/* Form to log interaction */}
                <form onSubmit={handleAddLog} className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <select
                      value={interactionType}
                      onChange={(e: any) => setInteractionType(e.target.value)}
                      className="h-7 px-2 rounded bg-black/60 border border-white/10 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="call">Звонок</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="meeting">Встреча</option>
                      <option value="note">Заметка</option>
                    </select>
                    <input
                      type="text"
                      value={interactionText}
                      onChange={(e) => setInteractionText(e.target.value)}
                      placeholder="Что обсудили или отправили..."
                      className="flex-1 h-7 px-2 rounded bg-black/60 border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!interactionText.trim()}
                      className="h-7 px-3 rounded bg-white text-black text-xs font-medium hover:bg-zinc-200 disabled:opacity-40 transition-colors"
                    >
                      Добавить
                    </button>
                  </div>
                </form>

                {/* Interaction items */}
                <div className="space-y-2 max-h-52 overflow-y-auto pt-2">
                  {(!lead.interactions || lead.interactions.length === 0) ? (
                    <p className="text-[11px] text-zinc-600 text-center py-4">
                      Взаимодействий с клиентом пока не зафиксировано
                    </p>
                  ) : (
                    lead.interactions.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span className="uppercase text-white font-semibold">{item.type}</span>
                          <span>{item.date}</span>
                        </div>
                        <p className="text-zinc-300 text-xs leading-relaxed">{item.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 border-t border-white/8 bg-[#0e0e0e] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-500 font-mono">
            Обнаружено: {lead.foundDate} · Источник: {lead.source}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
