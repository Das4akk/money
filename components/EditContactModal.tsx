/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertTriangle,
  ExternalLink,
  Search,
  Trash2,
  ShieldCheck,
  Send,
  MessageSquare,
} from 'lucide-react';
import { BryanskLead } from '@/lib/types';
import {
  extractTelegramUsername,
  cleanVkUrl,
  getContactSearchLinks,
} from '@/lib/leadLogic';

interface EditContactModalProps {
  lead: BryanskLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<BryanskLead>) => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
}) => {
  const [tgInput, setTgInput] = useState('');
  const [vkInput, setVkInput] = useState('');
  const [isTgVerified, setIsTgVerified] = useState(false);
  const [isVkVerified, setIsVkVerified] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (lead) {
      setTgInput(lead.telegram || '');
      setVkInput(lead.vk || '');
      setIsTgVerified(Boolean(lead.isTgVerified));
      setIsVkVerified(Boolean(lead.isVkVerified));
      setSaveSuccess(false);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const searchLinks = getContactSearchLinks(lead.name, lead.district, lead.phone);

  const handleSave = async () => {
    const cleanTg = extractTelegramUsername(tgInput);
    const cleanVk = cleanVkUrl(vkInput);

    const updates: Partial<BryanskLead> = {
      telegram: cleanTg || (tgInput.trim() ? tgInput.trim() : undefined),
      isTgVerified: Boolean(tgInput.trim()) ? isTgVerified : false,
      vk: cleanVk || (vkInput.trim() ? vkInput.trim() : undefined),
      isVkVerified: Boolean(vkInput.trim()) ? isVkVerified : false,
    };

    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      onUpdateLead(lead.id, updates);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving contact updates:', err);
    }
  };

  const handleClearTg = async () => {
    setTgInput('');
    setIsTgVerified(false);
    await fetch(`/api/leads/${lead.id}/verify-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-tg' }),
    });
    onUpdateLead(lead.id, {
      telegram: undefined,
      telegramUrl: undefined,
      isTgVerified: false,
      hasTelegramDirect: false,
    });
  };

  const handleClearVk = async () => {
    setVkInput('');
    setIsVkVerified(false);
    await fetch(`/api/leads/${lead.id}/verify-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear-vk' }),
    });
    onUpdateLead(lead.id, { vk: undefined, isVkVerified: false });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="font-bold text-base text-white">Проверка и правка контактов TG / VK</h3>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{lead.name} · {lead.district}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Assistant Box */}
        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Search className="w-4 h-4" />
            <span>Помощник точного поиска контактов в Брянске:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={searchLinks.vkSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#252525] border border-white/10 text-xs text-blue-400 transition-colors"
            >
              <span>Поиск сообщества в VK</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={searchLinks.yandexSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#252525] border border-white/10 text-xs text-amber-400 transition-colors"
            >
              <span>Поиск в Яндексе</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {searchLinks.tgPhoneUrl && (
              <a
                href={searchLinks.tgPhoneUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#252525] border border-white/10 text-xs text-sky-400 transition-colors"
              >
                <span>Прямой TG по номеру (+79..)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Telegram Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram канал / аккаунт</span>
            </label>
            {lead.telegram && (
              <button
                onClick={handleClearTg}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Неверный (очистить)</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={tgInput}
              onChange={(e) => setTgInput(e.target.value)}
              placeholder="@username или ссылка t.me/..."
              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={isTgVerified}
              onChange={(e) => setIsTgVerified(e.target.checked)}
              className="rounded border-zinc-700 text-sky-500 focus:ring-sky-400"
            />
            <span>Отметить Telegram как подтвержденный вручную</span>
          </label>
        </div>

        {/* VK Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span className="font-bold text-blue-400 text-sm">VK</span>
              <span>Группа или страница ВКонтакте</span>
            </label>
            {lead.vk && (
              <button
                onClick={handleClearVk}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Неверный (очистить)</span>
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={vkInput}
              onChange={(e) => setVkInput(e.target.value)}
              placeholder="https://vk.com/club... или slug"
              className="w-full bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={isVkVerified}
              onChange={(e) => setIsVkVerified(e.target.checked)}
              className="rounded border-zinc-700 text-blue-500 focus:ring-blue-400"
            />
            <span>Отметить сообщество VK как проверенное</span>
          </label>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/5"
          >
            Отмена
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            {saveSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{saveSuccess ? 'Сохранено!' : 'Сохранить изменения'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
