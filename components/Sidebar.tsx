/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

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
  Sparkles,
  SendHorizontal,
  Flame,
} from 'lucide-react';
import { ViewType, DashboardStats } from '@/lib/types';

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
  const navItems: {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    alert?: boolean;
    highlight?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Обзор',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'message-generator',
      label: 'Генератор сообщений',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      highlight: true,
    },
    {
      id: 'all-leads',
      label: 'Все предприятия',
      icon: <Building2 className="w-4 h-4" />,
      badge: stats?.total,
    },
    {
      id: 'no-website',
      label: 'Без сайта (Горячие)',
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
      label: 'Контакты (TG/WA/VK)',
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
      label: 'Сканер организаций',
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center font-black text-white text-base tracking-wider shadow-md shadow-amber-500/10">
              FS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wide text-white uppercase">FORM STUDIO</span>
                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Даниил · Лиды Брянска</p>
            </div>
          </div>
        </div>

        {/* Quick Pitch CTA button */}
        <div className="px-3 pt-3">
          <button
            onClick={() => {
              onSelectView('message-generator');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold shadow-sm transition-all"
          >
            <SendHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Создать сообщение</span>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : item.highlight
                    ? 'text-amber-200 hover:text-white hover:bg-amber-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-black' : item.highlight ? 'text-amber-400' : 'text-zinc-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.highlight && !isActive && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    AI
                  </span>
                )}

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
        <div className="p-3 border-t border-white/10 m-3 rounded-lg bg-[#141414] border border-white/5">
          <div className="flex items-center gap-2 text-xs text-zinc-200">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium truncate">FORM STUDIO Outreach</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
            Фокус: барьер звонка, упущенная прибыль и конверсионные сайты в Брянске.
          </p>
        </div>
      </aside>
    </>
  );
};
