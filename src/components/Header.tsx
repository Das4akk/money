/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Play, Menu, Plus, Activity, RefreshCw } from 'lucide-react';
import { ScanState, AppSettings } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenScanner: () => void;
  onOpenAddModal: () => void;
  onToggleMobileMenu: () => void;
  scanState?: ScanState;
  settings?: AppSettings | null;
  onRefreshData: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenScanner,
  onOpenAddModal,
  onToggleMobileMenu,
  scanState,
  settings,
  onRefreshData,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080808]/90 backdrop-blur-md border-b border-white/8 px-4 lg:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5"
          aria-label="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по названию, телефону, адресу в Брянске..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#111111] border border-white/8 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Live API status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111111] border border-white/8 text-[11px] text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-zinc-300">OSM Live</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 font-mono">
            {settings?.hasGeminiApiKey ? 'AI Active' : 'AI Ready'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="Обновить базу"
          className="p-2 rounded-lg bg-[#111111] border border-white/8 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-white' : ''}`} />
        </button>

        {/* Add lead button */}
        <button
          onClick={onOpenAddModal}
          className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#111111] border border-white/8 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить</span>
        </button>

        {/* Start Scan button */}
        <button
          onClick={onOpenScanner}
          className={`flex items-center gap-2 px-3.5 h-9 rounded-lg text-xs font-medium transition-all ${
            scanState?.isScanning
              ? 'bg-rose-950 text-rose-200 border border-rose-800 animate-pulse'
              : 'bg-white text-black hover:bg-zinc-200 font-semibold shadow-sm'
          }`}
        >
          {scanState?.isScanning ? (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Сканирование ({scanState.progress}%)</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Запустить поиск</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
