/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

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
  Building,
  Globe,
} from 'lucide-react';
import {
  BRYANSK_DISTRICTS,
  BRYANSK_CATEGORIES,
  POPULAR_CITIES,
  ScanState,
  AppSettings,
  District,
} from '@/lib/types';

interface ScannerViewProps {
  scanState: ScanState;
  settings: AppSettings | null;
  onStartScan: (params: {
    city: string;
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
  const [selectedCity, setSelectedCity] = useState<string>('Брянск');
  const [isCustomCity, setIsCustomCity] = useState<boolean>(false);
  const [customCityName, setCustomCityName] = useState<string>('');

  const [selectedDistrict, setSelectedDistrict] = useState<string>('Весь город');
  const [citySearchFilter, setCitySearchFilter] = useState<string>('');
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

  const effectiveCity = isCustomCity ? (customCityName.trim() || 'Брянск') : selectedCity;

  const displayedCities = React.useMemo(() => {
    if (!citySearchFilter.trim()) return POPULAR_CITIES;
    const q = citySearchFilter.toLowerCase().trim();
    return POPULAR_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [citySearchFilter]);

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
      city: effectiveCity,
      categories: selectedCategories,
      district: selectedDistrict,
      limit,
      onlyNew,
      sources,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Radar className="w-5 h-5 text-amber-400" />
          <span>Сканер организаций в любом городе</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Сбор действующих предприятий через гео-реестр OpenStreetMap и картографические API в любом городе РФ
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

      {/* Live Monitor Widget */}
      <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                scanState.isScanning ? 'bg-amber-400 animate-ping' : 'bg-zinc-600'
              }`}
            />
            <div>
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Монитор процесса сканирования
              </h2>
              <p className="text-[11px] text-zinc-400">
                {scanState.isScanning
                  ? `Поиск: ${scanState.currentCategory} (г. ${scanState.currentCity || effectiveCity})`
                  : `Сканер готов к поиску в г. ${effectiveCity}`}
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
                className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all shadow-md"
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
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${scanState.progress}%` }}
            />
          </div>
        </div>

        {/* Live Terminal / Log output */}
        <div className="rounded-lg bg-black/80 border border-white/5 p-3 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-zinc-500 pb-1 border-b border-white/5 mb-1">
            <Terminal className="w-3 h-3" />
            <span>Системный журнал сканера FORM STUDIO</span>
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
        {/* Left 2 Cols: City, Geography & Categories */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111111] border border-white/10 space-y-5">
          {/* 1. City selection (ANY CITY IN RUSSIA) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>1. Выбор города для поиска</span>
              </label>
              <span className="text-[11px] font-semibold text-amber-300 font-mono">
                Текущий: г. {effectiveCity}
              </span>
            </div>

            {/* City search and filter input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={citySearchFilter}
                  onChange={(e) => setCitySearchFilter(e.target.value)}
                  placeholder="Быстрый поиск города (например: Воронеж, Смоленск, Сочи...)"
                  className="w-full bg-[#161616] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsCustomCity(!isCustomCity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isCustomCity
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-[#181818] border-dashed border-white/20 text-zinc-300 hover:text-white'
                }`}
              >
                {isCustomCity ? 'Использовать список' : '+ Ввести свой город'}
              </button>
            </div>

            {/* Custom city text input */}
            {isCustomCity ? (
              <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30 space-y-2">
                <label className="text-xs text-amber-300 font-semibold block">
                  Введите название любого города РФ или области:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCityName}
                    onChange={(e) => setCustomCityName(e.target.value)}
                    placeholder="Например: Клинцы, Орел, Смоленск, Курск, Тверь, Муром, Елец..."
                    className="flex-1 bg-[#181818] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCityName.trim()) {
                        setSelectedDistrict('Весь город');
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    Применить
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Многоуровневый гео-локатор (OpenStreetMap + Photon) автоматически определит точные координаты и радиус поиска для любого населенного пункта РФ.
                </p>
              </div>
            ) : (
              /* Popular cities quick chips with search filter */
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-black/20 rounded-xl border border-white/5">
                {displayedCities.map((c) => {
                  const isSelected = !isCustomCity && selectedCity === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCity(c);
                        setIsCustomCity(false);
                        if (c === 'Брянск') {
                          setSelectedDistrict('Весь Брянск');
                        } else {
                          setSelectedDistrict('Весь город');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-sm'
                          : 'bg-[#161616] border-white/5 text-zinc-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
                {displayedCities.length === 0 && (
                  <div className="p-3 text-xs text-zinc-500 w-full text-center">
                    Город «{citySearchFilter}» не найден в быстром списке. Нажмите «+ Ввести свой город», чтобы искать в нем!
                  </div>
                )}
              </div>
            )}

            {/* City readiness banner */}
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-zinc-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Город для сканирования: <strong className="text-white">г. {effectiveCity}</strong></span>
              </span>
              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Координаты готовы
              </span>
            </div>
          </div>

          {/* 2. District selection if Bryansk */}
          {effectiveCity === 'Брянск' && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                2. Район города Брянска
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDistrict('Весь Брянск')}
                  className={`p-2 rounded-lg border text-xs font-medium text-left transition-colors ${
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
                    className={`p-2 rounded-lg border text-xs font-medium text-left transition-colors ${
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
          )}

          {/* 3. Categories multi-selector */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider block">
                3. Категории предприятий ({selectedCategories.length} из {BRYANSK_CATEGORIES.length})
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
                        ? 'bg-amber-500/10 border-amber-500/40 text-white'
                        : 'bg-[#161616] border-white/5 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
        <div className="p-5 rounded-xl bg-[#111111] border border-white/10 space-y-5">
          {/* Sources list */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider block">
              4. Источники данных
            </h3>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#161616] border border-white/8 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.includes('OpenStreetMap')}
                  onChange={() => toggleSource('OpenStreetMap')}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-medium text-white flex items-center gap-1.5">
                    <span>OpenStreetMap (OSM)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Бесплатный реестр с фильтрацией по любому городу и тегам
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#161616] border border-white/8 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sources.includes('2GIS')}
                  onChange={() => toggleSource('2GIS')}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-medium text-white flex items-center gap-1.5">
                    <span>2GIS Places API</span>
                    {settings?.twoGisApiKey ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        KEY OK
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        Нужен ключ
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Максимальная плотность контактов и телефонов
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Limits & Parameters */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider block">
              5. Параметры выборки
            </h3>

            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 block">
                Лимит организаций: <span className="font-mono text-white">{limit}</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => setOnlyNew(e.target.checked)}
                className="rounded border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span>Только новые (пропускать дубликаты)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
