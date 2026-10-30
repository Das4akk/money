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
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  totalLeadsCount,
}) => {
  if (!isOpen) return null;

  const [format, setFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [filter, setFilter] = useState<'all' | 'no-website' | 'with-telegram' | 'with-whatsapp' | 'high-potential'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = () => {
    setIsExporting(true);
    // Direct browser download via server endpoint
    const url = `/api/export?format=${format}&filter=${filter}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_bryansk_${filter}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Экспорт базы лидов Брянска</h2>
              <p className="text-[11px] text-zinc-400">Формирование структурированного файла</p>
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
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white uppercase tracking-wider block">
            1. Формат файла
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
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
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
                format === 'csv'
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-[#161616] border-white/8 text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs">CSV (UTF-8 BOM)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${
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

        {/* Filter Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white uppercase tracking-wider block">
            2. Выгружаемая выборка
          </label>
          <div className="space-y-1.5 text-xs">
            {[
              { id: 'all', label: `Все предприятия в базе (${totalLeadsCount})` },
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
                  className="text-white focus:ring-0 bg-zinc-900 border-zinc-700"
                />
                <span className="text-zinc-200">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Формирование файла...' : 'Скачать файл'}</span>
        </button>
      </div>
    </div>
  );
};
