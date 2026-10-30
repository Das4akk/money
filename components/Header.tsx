/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React from 'react';
import { Search, Play, Menu, Plus, Activity, RefreshCw, Sparkles, Send } from 'lucide-react';
import { ScanState, AppSettings } from '@/lib/types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenScanner: () => void;
  onOpenAddModal: () => void;
  onOpenMessageGenerator: () => void;
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
  onOpenMessageGenerator,
  onToggleMobileMenu,
  scanState,
  settings,
  onRefreshData,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-6 flex items-center justify-between gap-4">
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
            placeholder="Поиск по названию, телефону, улице в Брянске..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#141414] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* FORM STUDIO Quick Outreach button */}
        <button
          onClick={onOpenMessageGenerator}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Создать сообщение</span>
          <span className="sm:hidden">Оффер</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="Обновить базу"
          className="p-2 rounded-lg bg-[#141414] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-white' : ''}`} />
        </button>

        {/* Add lead button */}
        <button
          onClick={onOpenAddModal}
          className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#141414] border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
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
              <span>Поиск в Брянске</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
