/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Save,
  Server,
  Zap,
  Sparkles,
  Building,
  User,
} from 'lucide-react';
import { AppSettings } from '@/lib/types';

interface SettingsViewProps {
  settings: AppSettings | null;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [senderName, setSenderName] = useState('Даниил');
  const [companyName, setCompanyName] = useState('FORM STUDIO');
  const [senderRole, setSenderRole] = useState('Основатель FORM STUDIO / Разработка сайтов и онлайн-записи');
  const [customSignature, setCustomSignature] = useState('Даниил | FORM STUDIO (Брянск)');
  const [twoGisKey, setTwoGisKey] = useState('');
  const [yandexKey, setYandexKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [crawlerTimeout, setCrawlerTimeout] = useState(20);
  const [rateLimit, setRateLimit] = useState(60);
  const [autoCheckWebsites, setAutoCheckWebsites] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setSenderName(settings.senderName || 'Даниил');
      setCompanyName(settings.companyName || 'FORM STUDIO');
      setSenderRole(settings.senderRole || 'Основатель FORM STUDIO / Разработка сайтов и онлайн-записи');
      setCustomSignature(settings.customSignature || 'Даниил | FORM STUDIO (Брянск)');
      setTwoGisKey(settings.twoGisApiKey || '');
      setYandexKey(settings.yandexApiKey || '');
      setGoogleKey(settings.googlePlacesApiKey || '');
      setCrawlerTimeout(settings.crawlerTimeoutSeconds || 20);
      setRateLimit(settings.rateLimitPerMinute || 60);
      setAutoCheckWebsites(settings.autoCheckWebsites ?? true);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const success = await onSaveSettings({
      senderName,
      companyName,
      senderRole,
      customSignature,
      twoGisApiKey: twoGisKey,
      yandexApiKey: yandexKey,
      googlePlacesApiKey: googleKey,
      crawlerTimeoutSeconds: Number(crawlerTimeout),
      rateLimitPerMinute: Number(rateLimit),
      autoCheckWebsites,
    });

    setIsSaving(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-white" />
          <span>Настройки FORM STUDIO & API</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Профиль отправителя, студии, шаблоны подписей и интеграция с источниками данных
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand & Author Identity */}
        <div className="p-5 rounded-2xl bg-[#111111] border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <User className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Профиль отправителя и студии (Даниил · FORM STUDIO)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-300 block mb-1.5 font-medium">Ваше имя</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Даниил"
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1.5 font-medium">Название студии / компании</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="FORM STUDIO"
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-semibold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">Позиционирование / Роль</label>
            <input
              type="text"
              value={senderRole}
              onChange={(e) => setSenderRole(e.target.value)}
              placeholder="Основатель FORM STUDIO / Разработка конверсионных сайтов и систем онлайн-записи"
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">Подпись в сообщениях</label>
            <input
              type="text"
              value={customSignature}
              onChange={(e) => setCustomSignature(e.target.value)}
              placeholder="С уважением, Даниил | FORM STUDIO (Брянск)"
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* AI Engine Status Card */}
        <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Серверный генератор предложений (Gemini 3.8 Flash)
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              АКТИВЕН
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Генерация персонализированных коммерческих офферов работает на стороне сервера с автоматической поддержкой мгновенного офлайн-шаблонизатора FORM STUDIO.
          </p>
        </div>

        {/* External Map & Registry Keys */}
        <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Server className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Источники данных и API карт
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-300 block mb-1">
                2GIS Places API Key (Опционально)
              </label>
              <input
                type="text"
                value={twoGisKey}
                onChange={(e) => setTwoGisKey(e.target.value)}
                placeholder="Вставьте ключ 2GIS или оставьте пустым (работает через OpenStreetMap)"
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 block mb-1">
                Яндекс Карты API Key (Опционально)
              </label>
              <input
                type="text"
                value={yandexKey}
                onChange={(e) => setYandexKey(e.target.value)}
                placeholder="Вставьте ключ Яндекс Карт API"
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save button & status */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Настройки успешно сохранены!</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Сохранение...' : 'Сохранить настройки'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
