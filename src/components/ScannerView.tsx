/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Radar,
  Play,
  Square,
  Sparkles,
  MapPin,
  CheckSquare,
  Square as EmptySquare,
  AlertTriangle,
  Layers,
  Database,
  Terminal,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  BRYANSK_DISTRICTS,
  BRYANSK_CATEGORIES,
  ScanState,
  AppSettings,
  District,
} from '../types';

interface ScannerViewProps {
  scanState: ScanState;
  settings: AppSettings | null;
  onStartScan: (params: {
    categories: string[];
    district: string;
    limit: number;
    onlyNew: boolean;
    sources: string[];
  }) => void;
  onStopScan: () => void;
  onNavigateToSettings: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  scanState,
  settings,
  onStartScan,
  onStopScan,
  onNavigateToSettings,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Весь Брянск');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Автосервисы',
    'СТО',
    'Стоматологии',
    'Салоны красоты',
    'Строительные компании',
  ]);
  const [limit, setLimit] = useState<number>(30);
  const [onlyNew, setOnlyNew] = useState<boolean>(true);
  const [sources, setSources] = useState<string[]>(['OpenStreetMap']);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return; // keep at least one
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const selectAllCategories = () => {
    setSelectedCategories([...BRYANSK_CATEGORIES]);
  };

  const clearCategories = () => {
    setSelectedCategories(['Автосервисы']);
  };

  const toggleSource = (src: string) => {
    if (sources.includes(src)) {
      if (sources.length === 1) return;
      setSources(sources.filter((s) => s !== src));
    } else {
      // Check if requires key
      if (src === '2GIS' && !settings?.twoGisApiKey) {
        setNotice('Для 2GIS требуется API-ключ. Настройте его во вкладке «Настройки».');
      }
      if (src === 'Yandex' && !settings?.yandexApiKey) {
        setNotice('Для Яндекс Карт требуется API-ключ. Настройте его во вкладке «Настройки».');
      }
      if (src === 'Google' && !settings?.googlePlacesApiKey) {
        setNotice('Для Google Places требуется API-ключ. Настройте его во вкладке «Настройки».');
      }
      setSources([...sources, src]);
    }
  };

  const handleStart = () => {
    setNotice(null);
    onStartScan({
      categories: selectedCategories,
      district: selectedDistrict,
      limit,
      onlyNew,
      sources,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Radar className="w-5 h-5 text-white" />
          <span>Сканер организаций города Брянска</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Сбор действующих предприятий через открытый гео-реестр OpenStreetMap и коммерческие картографические API
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/40 text-xs text-amber-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="text-[11px] underline font-medium hover:text-white shrink-0"
          >
            Перейти в Настройки
          </button>
        </div>
      )}

      {/* Live Monitor Widget if scanning or recently scanned */}
      <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                scanState.isScanning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'
              }`}
            />
            <div>
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Монитор процесса сканирования
              </h2>
              <p className="text-[11px] text-zinc-400">
                {scanState.isScanning
                  ? `Поиск: ${scanState.currentCategory} (${scanState.currentDistrict})`
                  : 'Сканер готов к работе'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 block">Найдено в сессии:</span>
              <span className="text-base font-bold font-mono text-white">{scanState.totalFound} орг.</span>
            </div>

            {scanState.isScanning ? (
              <button
                onClick={onStopScan}
                className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-semibold border border-rose-800 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
                <span>Остановить поиск</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-black text-black" />
                <span>Начать сканирование</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>Прогресс выполнения</span>
            <span>{scanState.progress}%</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 rounded-full"
              style={{ width: `${scanState.progress}%` }}
            />
          </div>
        </div>

        {/* Live Terminal / Log output */}
        <div className="rounded-lg bg-black/80 border border-white/5 p-3 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-zinc-500 pb-1 border-b border-white/5 mb-1">
            <Terminal className="w-3 h-3" />
            <span>Системный журнал сканера LEADS BRYANSK</span>
          </div>
          {scanState.logs.length === 0 ? (
            <div className="text-zinc-600">Ожидание команды запуска...</div>
          ) : (
            scanState.logs.map((log, idx) => (
              <div key={idx} className="text-zinc-300 leading-relaxed">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scan Parameters Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Geography & Categories */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111111] border border-white/8 space-y-5">
          {/* Geography selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white uppercase tracking-wider block">
              1. География поиска в Брянске
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDistrict('Весь Брянск')}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                  selectedDistrict === 'Весь Брянск'
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-[#161616] border-white/8 text-zinc-300 hover:border-white/20'
                }`}
              >
                Весь Брянск
              </button>
              {BRYANSK_DISTRICTS.map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setSelectedDistrict(dist)}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                    selectedDistrict === dist
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#161616] border-white/8 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>
          </div>

          {/* Categories multi-selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                2. Категории предприятий ({selectedCategories.length} из {BRYANSK_CATEGORIES.length})
              </label>
              <div className="flex items-center gap-3 text-[11px]">
                <button
                  onClick={selectAllCategories}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Выбрать все
                </button>
                <span className="text-zinc-600">·</span>
                <button
                  onClick={clearCategories}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Сбросить
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
              {BRYANSK_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-[#161616] border-white/5 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-white shrink-0" />
                    ) : (
                      <EmptySquare className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    )}
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Sources & Options */}
        <div className="p-5 rounded-xl bg-[#111111] border border-white/8 space-y-5">
          {/* Sources list */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider block">
              3. Источники данных
            </h3>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#161616] border border-white/8 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.includes('OpenStreetMap')}
                  onChange={() => toggleSource('OpenStreetMap')}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>OpenStreetMap Overpass</span>
                    <span className="text-[10px] text-emerald-400 font-mono">АКТИВЕН</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Бесплатный живой гео-реестр узлов и адресов Брянска
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#161616] border border-white/8 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.includes('2GIS')}
                  onChange={() => toggleSource('2GIS')}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>2GIS Catalog API</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {settings?.twoGisApiKey ? 'ПОДКЛЮЧЕН' : 'НУЖЕН КЛЮЧ'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Официальный каталог филиалов и телефонов
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#161616] border border-white/8 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.includes('Yandex')}
                  onChange={() => toggleSource('Yandex')}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Яндекс Карты API</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {settings?.yandexApiKey ? 'ПОДКЛЮЧЕН' : 'НУЖЕН КЛЮЧ'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Поиск организаций и контактных номеров
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Limits & Deduplication */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider block">
              4. Настройки сессии
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Лимит результатов</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full h-8 px-2.5 rounded-lg bg-[#161616] border border-white/8 text-xs text-white focus:outline-none"
                >
                  <option value={15}>15 предприятий</option>
                  <option value={30}>30 предприятий</option>
                  <option value={50}>50 предприятий</option>
                  <option value={100}>100 предприятий</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
                <input
                  type="checkbox"
                  checked={onlyNew}
                  onChange={(e) => setOnlyNew(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-white focus:ring-0"
                />
                <span className="text-zinc-300">Только новые организации (пропуск дубликатов)</span>
              </label>
            </div>
          </div>

          {/* Start CTA */}
          <button
            onClick={handleStart}
            disabled={scanState.isScanning}
            className="w-full py-2.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-black text-black" />
            <span>Запустить сбор предприятий</span>
          </button>
        </div>
      </div>
    </div>
  );
};
