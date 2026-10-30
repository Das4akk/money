/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LeadsTableView } from './components/LeadsTableView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { ScannerView } from './components/ScannerView';
import { SettingsView } from './components/SettingsView';
import { ExportModal } from './components/ExportModal';
import { AddLeadModal } from './components/AddLeadModal';
import {
  BryanskLead,
  ViewType,
  DashboardStats,
  ScanState,
  AppSettings,
  CRMStatus,
} from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [leads, setLeads] = useState<BryanskLead[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedLead, setSelectedLead] = useState<BryanskLead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Scan state
  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    progress: 0,
    totalFound: 0,
    currentCategory: '',
    currentDistrict: '',
    logs: [],
  });

  // Fetch all leads
  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLeads();
    fetchStats();
    fetchSettings();
  }, [fetchLeads, fetchStats, fetchSettings]);

  // Polling scanner state if active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (scanState.isScanning) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/scan/status');
          if (res.ok) {
            const data: ScanState = await res.json();
            setScanState(data);
            if (!data.isScanning) {
              fetchLeads();
              fetchStats();
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanState.isScanning, fetchLeads, fetchStats]);

  // Update single lead
  const handleUpdateLead = async (id: string, updates: Partial<BryanskLead>) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated: BryanskLead = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead(updated);
        }
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  // Add interaction
  const handleAddInteraction = async (
    leadId: string,
    type: 'call' | 'whatsapp' | 'telegram' | 'meeting' | 'note',
    text: string
  ) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text }),
      });
      if (res.ok) {
        const newLog = await res.json();
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, interactions: [newLog, ...(l.interactions || [])] }
              : l
          )
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev) =>
            prev ? { ...prev, interactions: [newLog, ...(prev.interactions || [])] } : null
          );
        }
      }
    } catch (err) {
      console.error('Error adding interaction:', err);
    }
  };

  // Delete lead
  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        if (selectedLead?.id === id) {
          setSelectedLead(null);
        }
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // Batch delete
  const handleBatchDelete = async (ids: string[]) => {
    try {
      const res = await fetch('/api/leads/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const idSet = new Set(ids);
        setLeads((prev) => prev.filter((l) => !idSet.has(l.id)));
        fetchStats();
      }
    } catch (err) {
      console.error('Error batch deleting:', err);
    }
  };

  // Batch favorite
  const handleBatchFavorite = async (ids: string[], isFavorite: boolean) => {
    try {
      const res = await fetch('/api/leads/batch-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isFavorite }),
      });
      if (res.ok) {
        const idSet = new Set(ids);
        setLeads((prev) =>
          prev.map((l) => (idSet.has(l.id) ? { ...l, isFavorite } : l))
        );
      }
    } catch (err) {
      console.error('Error batch favoriting:', err);
    }
  };

  // Batch CRM status
  const handleBatchCrmStatus = async (ids: string[], crmStatus: CRMStatus) => {
    try {
      const res = await fetch('/api/leads/batch-crm-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, crmStatus }),
      });
      if (res.ok) {
        const idSet = new Set(ids);
        setLeads((prev) =>
          prev.map((l) => (idSet.has(l.id) ? { ...l, crmStatus } : l))
        );
        fetchStats();
      }
    } catch (err) {
      console.error('Error batch status:', err);
    }
  };

  // Find Telegram for single lead
  const handleFindTelegram = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}/find-telegram`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.lead) {
          setLeads((prev) => prev.map((l) => (l.id === id ? data.lead : l)));
          if (selectedLead && selectedLead.id === id) {
            setSelectedLead(data.lead);
          }
          fetchStats();
        }
      }
    } catch (err) {
      console.error('Error finding telegram:', err);
    }
  };

  // Batch Find Telegram
  const handleBatchFindTelegram = async (ids: string[]) => {
    try {
      const res = await fetch('/api/leads/batch-find-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchLeads();
        await fetchStats();
        alert(`Поиск Telegram завершен. Обновлено организаций: ${data.updatedCount || 0}`);
      }
    } catch (err) {
      console.error('Error batch finding telegram:', err);
    }
  };

  // Deduplication
  const handleDeduplicate = async () => {
    try {
      const res = await fetch('/api/leads/deduplicate', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Дедупликация завершена: удалено дубликатов: ${data.duplicatesRemoved}. Всего предприятий в базе: ${data.remainingCount}`
        );
        fetchLeads();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deduplicating:', err);
    }
  };

  // Start scanner
  const handleStartScan = async (params: {
    categories: string[];
    district: string;
    limit: number;
    onlyNew: boolean;
    sources: string[];
  }) => {
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (res.ok) {
        setScanState(data.state);
      } else {
        alert(data.error || 'Не удалось запустить сканирование');
      }
    } catch (err: any) {
      alert(`Ошибка сети при запуске: ${err.message}`);
    }
  };

  // Stop scanner
  const handleStopScan = async () => {
    try {
      const res = await fetch('/api/scan/stop', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScanState(data.status);
        fetchLeads();
        fetchStats();
      }
    } catch (err) {
      console.error('Error stopping scan:', err);
    }
  };

  // Save settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        fetchSettings();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Add lead manually
  const handleAddLead = async (leadData: any) => {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (res.ok) {
      const newLead = await res.json();
      setLeads((prev) => [newLead, ...prev]);
      fetchStats();
    }
  };

  // Filter leads for specific views
  const displayLeads = React.useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase().trim();
    return leads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        lead.address.toLowerCase().includes(q) ||
        lead.category.toLowerCase().includes(q) ||
        lead.district.toLowerCase().includes(q)
      );
    });
  }, [leads, searchQuery]);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        stats={stats}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenScanner={() => setCurrentView('scanner')}
          onOpenAddModal={() => setIsAddOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          scanState={scanState}
          settings={settings}
          onRefreshData={() => {
            fetchLeads();
            fetchStats();
          }}
          isLoading={isLoading}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              recentLeads={leads}
              onSelectLead={setSelectedLead}
              onNavigate={setCurrentView}
              onOpenScanner={() => setCurrentView('scanner')}
              onOpenExport={() => setIsExportOpen(true)}
              scanState={scanState}
            />
          )}

          {currentView === 'all-leads' && (
            <LeadsTableView
              leads={displayLeads}
              onSelectLead={setSelectedLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onBatchDelete={handleBatchDelete}
              onBatchFavorite={handleBatchFavorite}
              onBatchCrmStatus={handleBatchCrmStatus}
              onDeduplicate={handleDeduplicate}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenScanner={() => setCurrentView('scanner')}
              onFindTelegram={handleFindTelegram}
              onBatchFindTelegram={handleBatchFindTelegram}
              title="Все предприятия города Брянска"
            />
          )}

          {currentView === 'no-website' && (
            <LeadsTableView
              leads={displayLeads.filter(
                (l) => l.websiteStatus === 'NO_WEBSITE' || l.websiteStatus === 'SOCIAL_ONLY'
              )}
              onSelectLead={setSelectedLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onBatchDelete={handleBatchDelete}
              onBatchFavorite={handleBatchFavorite}
              onBatchCrmStatus={handleBatchCrmStatus}
              onDeduplicate={handleDeduplicate}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenScanner={() => setCurrentView('scanner')}
              onFindTelegram={handleFindTelegram}
              onBatchFindTelegram={handleBatchFindTelegram}
              title="Предприятия Брянска без сайта (Горячие лиды)"
              defaultWebsiteFilter="NO_WEBSITE"
            />
          )}

          {currentView === 'has-website' && (
            <LeadsTableView
              leads={displayLeads.filter((l) => l.websiteStatus === 'HAS_WEBSITE')}
              onSelectLead={setSelectedLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onBatchDelete={handleBatchDelete}
              onBatchFavorite={handleBatchFavorite}
              onBatchCrmStatus={handleBatchCrmStatus}
              onDeduplicate={handleDeduplicate}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenScanner={() => setCurrentView('scanner')}
              onFindTelegram={handleFindTelegram}
              onBatchFindTelegram={handleBatchFindTelegram}
              title="Предприятия с действующим сайтом"
              defaultWebsiteFilter="HAS_WEBSITE"
            />
          )}

          {currentView === 'needs-review' && (
            <LeadsTableView
              leads={displayLeads.filter(
                (l) => l.websiteStatus === 'NEEDS_REVIEW' || l.websiteStatus === 'WEBSITE_INACTIVE'
              )}
              onSelectLead={setSelectedLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onBatchDelete={handleBatchDelete}
              onBatchFavorite={handleBatchFavorite}
              onBatchCrmStatus={handleBatchCrmStatus}
              onDeduplicate={handleDeduplicate}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenScanner={() => setCurrentView('scanner')}
              onFindTelegram={handleFindTelegram}
              onBatchFindTelegram={handleBatchFindTelegram}
              title="Требуют проверки / Неработающие сайты"
              defaultWebsiteFilter="NEEDS_REVIEW"
            />
          )}

          {currentView === 'contacts' && (
            <LeadsTableView
              leads={displayLeads.filter((l) => l.hasWhatsapp || Boolean(l.telegram || l.hasTelegramDirect))}
              onSelectLead={setSelectedLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onBatchDelete={handleBatchDelete}
              onBatchFavorite={handleBatchFavorite}
              onBatchCrmStatus={handleBatchCrmStatus}
              onDeduplicate={handleDeduplicate}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenScanner={() => setCurrentView('scanner')}
              onFindTelegram={handleFindTelegram}
              onBatchFindTelegram={handleBatchFindTelegram}
              title="Прямые контакты (WhatsApp и Telegram)"
              filterByMessengers={true}
            />
          )}

          {currentView === 'favorites' && (
            <LeadsTableView
              leads={displayLeads.filter((l) => l.isFavorite)}
              onSelectLead={setSelectedLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onBatchDelete={handleBatchDelete}
              onBatchFavorite={handleBatchFavorite}
              onBatchCrmStatus={handleBatchCrmStatus}
              onDeduplicate={handleDeduplicate}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenScanner={() => setCurrentView('scanner')}
              onFindTelegram={handleFindTelegram}
              onBatchFindTelegram={handleBatchFindTelegram}
              title="Избранные потенциальные клиенты"
              onlyFavorites={true}
            />
          )}

          {currentView === 'scanner' && (
            <ScannerView
              scanState={scanState}
              settings={settings}
              onStartScan={handleStartScan}
              onStopScan={handleStopScan}
              onNavigateToSettings={() => setCurrentView('settings')}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView settings={settings} onSaveSettings={handleSaveSettings} />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
        onAddInteraction={handleAddInteraction}
        onFindTelegram={handleFindTelegram}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        totalLeadsCount={leads.length}
      />

      <AddLeadModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddLead={handleAddLead}
      />
    </div>
  );
}
