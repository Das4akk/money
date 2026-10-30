/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  CircleOff,
  Globe,
  HelpCircle,
  PhoneCall,
  Star,
  Radar,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { ViewType, DashboardStats } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  stats?: DashboardStats | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  stats,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: number; alert?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Обзор',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'all-leads',
      label: 'Все предприятия',
      icon: <Building2 className="w-4 h-4" />,
      badge: stats?.total,
    },
    {
      id: 'no-website',
      label: 'Без сайта',
      icon: <CircleOff className="w-4 h-4" />,
      badge: stats ? stats.noWebsite + stats.socialOnly : undefined,
      alert: true,
    },
    {
      id: 'has-website',
      label: 'С сайтом',
      icon: <Globe className="w-4 h-4" />,
      badge: stats?.hasWebsite,
    },
    {
      id: 'needs-review',
      label: 'Требуют проверки',
      icon: <HelpCircle className="w-4 h-4" />,
      badge: stats ? stats.needsReview + stats.websiteInactive : undefined,
    },
    {
      id: 'contacts',
      label: 'Контакты',
      icon: <PhoneCall className="w-4 h-4" />,
      badge: stats ? stats.whatsappFound + (stats.telegramFound || 0) + (stats.telegramDirectFound || 0) : undefined,
    },
    {
      id: 'favorites',
      label: 'Избранное',
      icon: <Star className="w-4 h-4" />,
    },
    {
      id: 'scanner',
      label: 'Источники данных',
      icon: <Radar className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080808] border-r border-white/8 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#111111] border border-white/10 flex items-center justify-center font-bold text-white text-base tracking-wider shadow-inner">
              LB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white uppercase">LEADS BRYANSK</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono tracking-tight">Lead Gen CRM · Брянск</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Разделы системы
          </div>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-black' : 'text-zinc-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive
                        ? 'bg-black/10 text-black'
                        : item.alert
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/30'
                        : 'bg-white/5 text-zinc-400 border border-white/5'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info box */}
        <div className="p-3 border-t border-white/8 m-3 rounded-lg bg-[#111111] border border-white/5">
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Реальные реестры Брянска</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
            OSM Live + 4 района города. Полная верификация веб-сайтов.
          </p>
        </div>
      </aside>
    </>
  );
};
