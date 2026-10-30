/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

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
  Plus,
  Clock,
  ShieldCheck,
  Building,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  Edit3,
} from 'lucide-react';
import {
  BryanskLead,
  CRM_STATUS_LABELS,
  WEBSITE_STATUS_LABELS,
  CRMStatus,
} from '@/lib/types';
import { calculateLostProfitAudit, getContactSearchLinks } from '@/lib/leadLogic';
import { EditContactModal } from './EditContactModal';

interface LeadDetailModalProps {
  lead: BryanskLead | null;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<BryanskLead>) => void;
  onAddInteraction: (leadId: string, log: { type: any; text: string; author: string }) => void;
  onOpenMessageGeneratorForLead?: (lead: BryanskLead) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onUpdateLead,
  onAddInteraction,
  onOpenMessageGeneratorForLead,
}) => {
  if (!lead) return null;

  const [notes, setNotes] = useState(lead.notes || '');
  const [nextContactDate, setNextContactDate] = useState(lead.nextContactDate || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);

  // Gemini Pitch state in modal
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [pitchContent, setPitchContent] = useState<string | null>(null);

  // Interaction input state
  const [interactionType, setInteractionType] = useState<any>('whatsapp');
  const [interactionText, setInteractionText] = useState('');

  const audit = calculateLostProfitAudit(lead);
  const searchLinks = getContactSearchLinks(lead.name, lead.district, lead.phone);

  const handleGeneratePitch = async () => {
    setIsGeneratingPitch(true);
    try {
      const res = await fetch('/api/leads/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          channel: 'whatsapp',
          angle: 'profit_and_booking',
          emphasizeBookingBarrier: true,
          senderName: 'Даниил',
          companyName: 'FORM STUDIO',
        }),
      });
      const data = await res.json();
      if (data.pitchText) {
        setPitchContent(data.pitchText);
      }
    } catch (err) {
      console.error('Error generating pitch:', err);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!pitchContent) return;
    navigator.clipboard.writeText(pitchContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    onUpdateLead(lead.id, {
      notes,
      nextContactDate: nextContactDate || undefined,
    });
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionText.trim()) return;

    onAddInteraction(lead.id, {
      type: interactionType,
      text: interactionText.trim(),
      author: 'Даниил (FORM STUDIO)',
    });
    setInteractionText('');
  };

  const crmMeta = CRM_STATUS_LABELS[lead.crmStatus];
  const webMeta = WEBSITE_STATUS_LABELS[lead.websiteStatus];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
        <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-4xl w-full my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 bg-[#141414]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-semibold">
                  FORM STUDIO AUDIT
                </span>
                <span className="text-xs text-zinc-400">{lead.district}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{lead.name}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{lead.category} · {lead.address}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenMessageGeneratorForLead && (
                <button
                  onClick={() => {
                    onOpenMessageGeneratorForLead(lead);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Открыть в Генераторе сообщений</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* 1. Contact & Verification Bar */}
            <div className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Прямые каналы связи организации
                </span>
                <button
                  onClick={() => setIsEditContactOpen(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Исправить / проверить TG и VK</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Phone / WA */}
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Телефон / WhatsApp</span>
                    {lead.hasWhatsapp && <span className="text-emerald-400 font-bold">WA ACTIVE</span>}
                  </div>
                  <div className="font-mono text-sm text-white font-semibold">
                    {lead.formattedPhone || lead.phone || 'Не найден'}
                  </div>
                  {lead.hasWhatsapp && (
                    <a
                      href={`https://wa.me/${lead.whatsappPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline pt-0.5"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Открыть чат WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Telegram */}
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Telegram</span>
                    {lead.isTgVerified ? (
                      <span className="text-sky-300 text-[10px] font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Проверен
                      </span>
                    ) : lead.telegram ? (
                      <span className="text-amber-400 text-[10px]">Авто-поиск</span>
                    ) : null}
                  </div>
                  <div className="font-mono text-sm text-sky-300 font-semibold truncate">
                    {lead.telegram || (lead.hasTelegramDirect ? lead.formattedPhone : 'Не найден')}
                  </div>
                  {(lead.telegramUrl || lead.telegram) && (
                    <a
                      href={lead.telegramUrl || `https://t.me/${lead.telegram?.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline pt-0.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Перейти в диалог TG</span>
                    </a>
                  )}
                </div>

                {/* VK */}
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>ВКонтакте</span>
                    {lead.isVkVerified && (
                      <span className="text-blue-300 text-[10px] font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Проверен
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-blue-300 truncate font-mono">
                    {lead.vk || 'Группа не найдена'}
                  </div>
                  {lead.vk && (
                    <a
                      href={lead.vk}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline pt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Открыть сообщество VK</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 2. FORM STUDIO Lost Profit Breakdown & Booking Barrier */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#161616] to-[#1c1917] border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wide">
                    Аудит упущенной прибыли и барьер звонка (FORM STUDIO)
                  </h3>
                </div>
                <span className="text-xs font-mono text-amber-300 font-bold">
                  Потери: ~{audit.monthlyLossMin.toLocaleString('ru-RU')} – {audit.monthlyLossMax.toLocaleString('ru-RU')} ₽ / мес
                </span>
              </div>

              {/* Silent Customer Barrier Highlight */}
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-200 block">
                    Фактор молчаливых клиентов: {audit.silentCustomersLossPercent}% утечки без онлайн-записи
                  </span>
                  <p className="text-zinc-300 leading-relaxed">
                    Людям психологически некомфортно напрямую созваниваться или списываться по поводу приема.
                    Если у «{lead.name}» нет понятного сайта с прозрачными ценами и онлайн-записью за 30 секунд — клиенты уходят к конкурентам в {lead.district}.
                  </p>
                </div>
              </div>

              {/* Breakdown items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {audit.breakdownReasons.map((reason, i) => (
                  <div key={i} className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
                      <span>{reason.title}</span>
                      <span className="text-amber-400 font-mono">{reason.lostSharePercent}%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{reason.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                <span>{audit.recommendationFormula}</span>
                <span className="font-bold font-mono whitespace-nowrap ml-2">ROI: 300%+</span>
              </div>
            </div>

            {/* 3. Instant Pitch Generator Box */}
            <div className="p-5 rounded-xl bg-[#141414] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Готовое предложение от Даниила (FORM STUDIO)</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGeneratePitch}
                    disabled={isGeneratingPitch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPitch ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingPitch ? 'Генерация...' : pitchContent ? 'Перегенерировать' : 'Сгенерировать оффер'}</span>
                  </button>

                  {pitchContent && (
                    <button
                      onClick={handleCopyPitch}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Скопировано!' : 'Скопировать'}</span>
                    </button>
                  )}
                </div>
              </div>

              {pitchContent ? (
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {pitchContent}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-black/30 border border-dashed border-white/10 text-center text-xs text-zinc-400">
                  Нажмите «Сгенерировать оффер», чтобы создать готовый текст для WhatsApp/Telegram с акцентом на барьер звонка и упущенную прибыль.
                </div>
              )}
            </div>

            {/* 4. CRM Status, Notes & Next Contact Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-3">
                <span className="text-xs font-semibold text-zinc-300 block">Управление статусом CRM</span>

                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CRM_STATUS_LABELS).map(([k, v]) => {
                    const isActive = lead.crmStatus === k;
                    return (
                      <button
                        key={k}
                        onClick={() => onUpdateLead(lead.id, { crmStatus: k as CRMStatus })}
                        className={`p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 font-bold'
                            : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-3">
                <span className="text-xs font-semibold text-zinc-300 block">Заметки и дата следующего контакта</span>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Заметки по переговорам, возражениям или договоренностям..."
                  className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={nextContactDate}
                    onChange={(e) => setNextContactDate(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSaveNotes}
                    className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    Сохранить заметки
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Interaction History */}
            <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-3">
              <span className="text-xs font-semibold text-zinc-300 block">История коммуникаций</span>

              <form onSubmit={handleAddLog} className="flex gap-2">
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="call">Звонок</option>
                  <option value="vk">ВКонтакте</option>
                  <option value="note">Заметка</option>
                </select>

                <input
                  type="text"
                  value={interactionText}
                  onChange={(e) => setInteractionText(e.target.value)}
                  placeholder="Добавить результат касания..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500"
                />

                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200"
                >
                  Добавить
                </button>
              </form>

              <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                {lead.interactions.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Пока нет записей в журнале</p>
                ) : (
                  lead.interactions.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span className="font-semibold uppercase">{log.type}</span>
                        <span>{log.date} · {log.author}</span>
                      </div>
                      <p className="text-zinc-200 leading-relaxed">{log.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit contact modal */}
      <EditContactModal
        lead={lead}
        isOpen={isEditContactOpen}
        onClose={() => setIsEditContactOpen(false)}
        onUpdateLead={onUpdateLead}
      />
    </>
  );
};
