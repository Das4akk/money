'use client';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, Code2, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalLeadsCount: number;
  availableCities?: string[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  totalLeadsCount,
  availableCities = ['Брянск'],
}) => {
  if (!isOpen) return null;

  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json' | 'txt'>('txt');
  const [filter, setFilter] = useState<'all' | 'no-website' | 'with-telegram' | 'with-whatsapp' | 'high-potential'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedTxt, setCopiedTxt] = useState(false);

  const handleDownload = () => {
    setIsExporting(true);
    const cityParam = selectedCity !== 'all' ? `&city=${encodeURIComponent(selectedCity)}` : '';
    const url = `/api/export?format=${format}&filter=${filter}${cityParam}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${selectedCity !== 'all' ? selectedCity : 'all'}_${filter}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 1000);
  };

  const handleCopyTxt = async () => {
    try {
      const cityParam = selectedCity !== 'all' ? `&city=${encodeURIComponent(selectedCity)}` : '';
      const res = await fetch(`/api/export?format=txt&filter=${filter}${cityParam}`);
      if (res.ok) {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        setCopiedTxt(true);
        setTimeout(() => setCopiedTxt(false), 2000);
      }
    } catch (err) {
      console.error('Error copying TXT:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Download className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Экспорт базы лидов и клиентов</h2>
              <p className="text-[11px] text-zinc-400">Формирование структурированного файла для рассылок и CRM</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white uppercase tracking-wider block">
            1. Выберите формат файла
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setFormat('txt')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                format === 'txt'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-[#161616] border-white/8 text-amber-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-current" />
              <span className="text-xs">TXT Текст</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                format === 'xlsx'
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-[#161616] border-white/8 text-zinc-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-xs">Excel XLSX</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                format === 'csv'
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-[#161616] border-white/8 text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs">CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                format === 'json'
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-[#161616] border-white/8 text-zinc-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="text-xs">JSON</span>
            </button>
          </div>
        </div>

        {/* TXT Format preview alert */}
        {format === 'txt' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
              <span>Формат выгрузки в .txt:</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
                5 полей на организацию
              </span>
            </div>
            <pre className="text-[11px] font-mono text-zinc-300 bg-black/60 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
{`Предприятие: {сфера/категория}
Название предприятия: {название}
Номер: {телефон}
Контакты: {тел, wa, tg, vk, адрес}
Есть сайт/нету: {Есть: url / Нету}`}
            </pre>
          </div>
        )}

        {/* City Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white uppercase tracking-wider block">
            2. Город выгрузки
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-[#161616] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">Все города в базе ({totalLeadsCount} орг.)</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                г. {city}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white uppercase tracking-wider block">
            3. Выгружаемая выборка
          </label>
          <div className="space-y-1.5 text-xs">
            {[
              { id: 'all', label: `Все предприятия в выборке (${totalLeadsCount})` },
              { id: 'no-website', label: 'Только предприятия без сайта и с соцсетями' },
              { id: 'high-potential', label: 'Только с высоким потенциалом (HIGH)' },
              { id: 'with-whatsapp', label: 'Только организации с WhatsApp' },
              { id: 'with-telegram', label: 'Только организации с Telegram' },
            ].map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-[#161616] border border-white/5 cursor-pointer hover:border-white/15 select-none"
              >
                <input
                  type="radio"
                  name="export-filter"
                  checked={filter === opt.id}
                  onChange={() => setFilter(opt.id as any)}
                  className="text-amber-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <span className="text-zinc-200">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex gap-2 pt-1">
          {format === 'txt' && (
            <button
              onClick={handleCopyTxt}
              type="button"
              className="px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-xs font-semibold hover:bg-[#222222] transition-colors flex items-center justify-center gap-2"
            >
              {copiedTxt ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <span>Копировать .txt</span>
              )}
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Формирование файла...' : `Скачать .${format}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
