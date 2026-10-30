/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Server,
  Zap,
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings | null;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [twoGisKey, setTwoGisKey] = useState('');
  const [yandexKey, setYandexKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [dadataKey, setDadataKey] = useState('');
  const [crawlerTimeout, setCrawlerTimeout] = useState(20);
  const [rateLimit, setRateLimit] = useState(60);
  const [autoCheckWebsites, setAutoCheckWebsites] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setTwoGisKey(settings.twoGisApiKey || '');
      setYandexKey(settings.yandexApiKey || '');
      setGoogleKey(settings.googlePlacesApiKey || '');
      setDadataKey(settings.dadataApiKey || '');
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
      twoGisApiKey: twoGisKey,
      yandexApiKey: yandexKey,
      googlePlacesApiKey: googleKey,
      dadataApiKey: dadataKey,
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
          <span>Настройки и подключение API источников</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Управление ключами картографических сервисов, открытых реестров и параметрами краулера
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Настройки и API-ключи успешно сохранены в защищенном хранилище backend!</span>
        </div>
      )}

      {/* Real-time Status Card */}
      <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-4">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-zinc-300" />
          <span>Статус встроенных интеграций</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-lg bg-[#161616] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">OpenStreetMap Overpass</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                АКТИВЕН И БЕСПЛАТЕН
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Поиск организаций по координатам Брянска (Советский, Бежица, Володарка, Фокино) без ограничений по ключам.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#161616] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Google Gemini 3.8 Flash</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  settings?.hasGeminiApiKey
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {settings?.hasGeminiApiKey ? 'ПОДКЛЮЧЕН' : 'ОЖИДАЕТ КЛЮЧ'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Генерация персонализированных коммерческих предложений, аудит доменов и нишевый анализ рынка Брянска.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-5">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-zinc-300" />
            <span>Коммерческие API-ключи (защищенное хранение на сервере)</span>
          </h2>

          <div className="space-y-4">
            {/* 2GIS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-200">2GIS Catalog API Key</label>
                <a
                  href="https://dev.2gis.ru"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1"
                >
                  <span>Получить на dev.2gis.ru</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={twoGisKey}
                onChange={(e) => setTwoGisKey(e.target.value)}
                placeholder="Вставьте ключ 2GIS (например, 7000...)"
                className="w-full h-9 px-3 rounded-lg bg-[#161616] border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 font-mono"
              />
              <p className="text-[10px] text-zinc-500">
                Используется для прямого доступа к базам филиалов и контактным телефонам 2GIS по Брянску.
              </p>
            </div>

            {/* Yandex Maps */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-200">Яндекс Карты (API Поиска по организациям)</label>
                <a
                  href="https://developer.tech.yandex.ru"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1"
                >
                  <span>Кабинет разработчика Яндекс</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={yandexKey}
                onChange={(e) => setYandexKey(e.target.value)}
                placeholder="Вставьте ключ API Поиска по организациям"
                className="w-full h-9 px-3 rounded-lg bg-[#161616] border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* Google Places */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-200">Google Places API Key</label>
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full h-9 px-3 rounded-lg bg-[#161616] border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 font-mono"
              />
            </div>

            {/* DaData */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-200">DaData API Token (Реестры ЮЛ и адресов РФ)</label>
                <a
                  href="https://dadata.ru"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white inline-flex items-center gap-1"
                >
                  <span>dadata.ru</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={dadataKey}
                onChange={(e) => setDadataKey(e.target.value)}
                placeholder="API-ключ DaData"
                className="w-full h-9 px-3 rounded-lg bg-[#161616] border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Crawler Parameters */}
        <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-4">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-300" />
            <span>Параметры проверки и лимитов</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-zinc-300">Таймаут запросов к внешним API (секунды)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={crawlerTimeout}
                onChange={(e) => setCrawlerTimeout(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg bg-[#161616] border border-white/10 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300">Лимит запросов в минуту</label>
              <input
                type="number"
                min={10}
                max={120}
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg bg-[#161616] border border-white/10 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 pt-2 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCheckWebsites}
              onChange={(e) => setAutoCheckWebsites(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
            />
            <span>Автоматически выполнять HTTP ping проверку обнаруженных доменов</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 h-10 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Сохранение...' : 'Сохранить настройки'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
