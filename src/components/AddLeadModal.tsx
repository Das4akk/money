/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Building2, Plus, Sparkles } from 'lucide-react';
import {
  BRYANSK_DISTRICTS,
  BRYANSK_CATEGORIES,
  District,
  BryanskLead,
} from '../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (leadData: any) => Promise<void>;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Автосервисы');
  const [district, setDistrict] = useState<District>('Советский район');
  const [address, setAddress] = useState('г. Брянск, ');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [vk, setVk] = useState('');
  const [telegram, setTelegram] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddLead({
        name: name.trim(),
        category,
        district,
        address: address.trim(),
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        vk: vk.trim() || undefined,
        telegram: telegram.trim() || undefined,
        notes: notes.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Добавить предприятие Брянска</h2>
              <p className="text-[11px] text-zinc-400">Ручной ввод в базу лидогенерации</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-zinc-300 block mb-1 font-medium">
              Название организации <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Автотехцентр Премиум Брянск"
              className="w-full h-8 px-3 rounded-lg bg-[#161616] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 block mb-1 font-medium">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-[#161616] border border-white/10 text-white focus:outline-none"
              >
                {BRYANSK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-300 block mb-1 font-medium">Район Брянска</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as District)}
                className="w-full h-8 px-2 rounded-lg bg-[#161616] border border-white/10 text-white focus:outline-none"
              >
                {BRYANSK_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-zinc-300 block mb-1 font-medium">Точный адрес</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="г. Брянск, ул. Фокина, д. 22"
              className="w-full h-8 px-3 rounded-lg bg-[#161616] border border-white/10 text-white placeholder-zinc-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 block mb-1 font-medium">Телефон</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (920) 123-45-67"
                className="w-full h-8 px-3 rounded-lg bg-[#161616] border border-white/10 text-white placeholder-zinc-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-300 block mb-1 font-medium">Telegram</label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username или t.me/..."
                className="w-full h-8 px-3 rounded-lg bg-[#161616] border border-white/10 text-white placeholder-zinc-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-300 block mb-1 font-medium">Веб-сайт (если есть)</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.ru"
                className="w-full h-8 px-3 rounded-lg bg-[#161616] border border-white/10 text-white placeholder-zinc-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-300 block mb-1 font-medium">ВКонтакте</label>
              <input
                type="text"
                value={vk}
                onChange={(e) => setVk(e.target.value)}
                placeholder="https://vk.com/..."
                className="w-full h-8 px-3 rounded-lg bg-[#161616] border border-white/10 text-white placeholder-zinc-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-300 block mb-1 font-medium">Первичная заметка</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация о клиенте..."
              className="w-full p-2.5 rounded-lg bg-[#161616] border border-white/10 text-white placeholder-zinc-600 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Добавление...' : 'Добавить организацию'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
