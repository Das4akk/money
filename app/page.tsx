/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { LeadsTableView } from '@/components/LeadsTableView';
import { MessageGeneratorView } from '@/components/MessageGeneratorView';
import { ScannerView } from '@/components/ScannerView';
import { SettingsView } from '@/components/SettingsView';
import { LeadDetailModal } from '@/components/LeadDetailModal';
import { ExportModal } from '@/components/ExportModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import {
  BryanskLead,
  DashboardStats,
  ScanState,
  AppSettings,
  ViewType,
  CRMStatus,
} from '@/lib/types';
import { INITIAL_BRYANSK_LEADS } from '@/lib/seedData';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [leads, setLeads] = useState<BryanskLead[]>(INITIAL_BRYANSK_LEADS);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedLead, setSelectedLead] = useState<BryanskLead | null>(null);
  const [messageGenLeadId, setMessageGenLeadId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    progress: 0,
    totalFound: 0,
    currentCategory: '',
    currentDistrict: '',
    logs: [],
  });

  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Fetch initial leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeads(data);
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
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
      console.error('Error fetching stats:', err);
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
      console.error('Error fetching settings:', err);
    }
  }, []);

  // Fetch scan status
  const fetchScanStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scan/status');
      if (res.ok) {
        const data = await res.json();
        setScanState(data);
      }
    } catch {
      // scan status poll fallback
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchStats();
    fetchSettings();
  }, [fetchLeads, fetchStats, fetchSettings]);

  // Poll scan state when scanning
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (scanState.isScanning) {
      interval = setInterval(() => {
        fetchScanStatus();
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanState.isScanning, fetchScanStatus]);

  // Lead update handler
  const handleUpdateLead = async (id: string, updates: Partial<BryanskLead>) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, ...updates } : null));
    }

    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchStats();
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  // Lead delete handler
  const handleDeleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead(null);
    }

    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      fetchStats();
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  // Batch delete handler
  const handleBatchDelete = async (ids: string[]) => {
    const idSet = new Set(ids);
    setLeads((prev) => prev.filter((l) => !idSet.has(l.id)));

    try {
      await fetch('/api/leads/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      fetchStats();
    } catch (err) {
      console.error('Error batch deleting:', err);
    }
  };

  // Batch favorite handler
  const handleBatchFavorite = async (ids: string[], isFavorite: boolean) => {
    const idSet = new Set(ids);
    setLeads((prev) =>
      prev.map((l) => (idSet.has(l.id) ? { ...l, isFavorite } : l))
    );

    try {
      await fetch('/api/leads/batch-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isFavorite }),
      });
    } catch (err) {
      console.error('Error batch favoriting:', err);
    }
  };

  // Batch CRM status handler
  const handleBatchCrmStatus = async (ids: string[], crmStatus: CRMStatus) => {
    const idSet = new Set(ids);
    setLeads((prev) =>
      prev.map((l) => (idSet.has(l.id) ? { ...l, crmStatus } : l))
    );

    try {
      await fetch('/api/leads/batch-crm-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, crmStatus }),
      });
      fetchStats();
    } catch (err) {
      console.error('Error batch CRM updating:', err);
    }
  };

  // Deduplication
  const handleDeduplicate = async () => {
    try {
      const res = await fetch('/api/leads/deduplicate', { method: 'POST' });
      if (res.ok) {
        fetchLeads();
        fetchStats();
      }
    } catch (err) {
      console.error('Error deduplicating:', err);
    }
  };

  // Add interaction
  const handleAddInteraction = async (
    leadId: string,
    log: { type: any; text: string; author: string }
  ) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (res.ok) {
        const newLog = await res.json();
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, interactions: [newLog, ...l.interactions] }
              : l
          )
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev) =>
            prev ? { ...prev, interactions: [newLog, ...prev.interactions] } : null
          );
        }
      }
    } catch (err) {
      console.error('Error adding interaction:', err);
    }
  };

  // Add lead
  const handleAddLead = async (leadData: any) => {
    try {
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
    } catch (err) {
      console.error('Error adding lead:', err);
    }
  };

  // Start scanner
  const handleStartScan = async (params: any) => {
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        setScanState(data.state);
      }
    } catch (err) {
      console.error('Error starting scan:', err);
    }
  };

  // Stop scanner
  const handleStopScan = async () => {
    try {
      const res = await fetch('/api/scan/stop', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScanState(data.status);
      }
    } catch (err) {
      console.error('Error stopping scan:', err);
    }
  };

  // Save settings
  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        return true;
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
    return false;
  };

  // Open Message Generator for specific lead
  const handleOpenMessageGeneratorForLead = (lead: BryanskLead) => {
    setMessageGenLeadId(lead.id);
    setCurrentView('message-generator');
  };

  // Filter leads for search query
  const displayLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase().trim();
    return leads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        lead.address.toLowerCase().includes(q) ||
        lead.category.toLowerCase().includes(q) ||
        lead.district.toLowerCase().includes(q) ||
        lead.telegram?.toLowerCase().includes(q) ||
        lead.vk?.toLowerCase().includes(q)
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
          onOpenMessageGenerator={() => setCurrentView('message-generator')}
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
          {/* 1. Dashboard View */}
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              recentLeads={leads}
              onSelectLead={setSelectedLead}
              onNavigate={setCurrentView}
              onOpenScanner={() => setCurrentView('scanner')}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
              scanState={scanState}
            />
          )}

          {/* 2. DEDICATED SEPARATE WINDOW: Message Generator View */}
          {currentView === 'message-generator' && (
            <MessageGeneratorView
              leads={leads}
              initialLeadId={messageGenLeadId}
              settings={settings}
              onUpdateLead={handleUpdateLead}
              onAddInteraction={handleAddInteraction}
            />
          )}

          {/* 3. All Leads Table */}
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
              onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
              title="Все предприятия города Брянска"
            />
          )}

          {/* 4. Leads Without Website (Hot Prospects) */}
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
              onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
              title="Предприятия Брянска без сайта (Горячие лиды)"
              defaultWebsiteFilter="NO_WEBSITE"
            />
          )}

          {/* 5. Leads With Website */}
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
              onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
              title="Предприятия с действующим сайтом"
              defaultWebsiteFilter="HAS_WEBSITE"
            />
          )}

          {/* 6. Needs Review */}
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
              onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
              title="Требуют проверки / Неработающие сайты"
              defaultWebsiteFilter="NEEDS_REVIEW"
            />
          )}

          {/* 7. Contacts (Direct WA & TG & VK) */}
          {currentView === 'contacts' && (
            <LeadsTableView
              leads={displayLeads.filter(
                (l) => l.hasWhatsapp || Boolean(l.telegram || l.hasTelegramDirect) || Boolean(l.vk)
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
              onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
              title="Прямые контакты (WhatsApp, Telegram, VK)"
              filterByMessengers={true}
            />
          )}

          {/* 8. Favorites */}
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
              onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
              title="Избранные потенциальные клиенты"
              onlyFavorites={true}
            />
          )}

          {/* 9. Scanner View */}
          {currentView === 'scanner' && (
            <ScannerView
              scanState={scanState}
              settings={settings}
              onStartScan={handleStartScan}
              onStopScan={handleStopScan}
              onNavigateToSettings={() => setCurrentView('settings')}
            />
          )}

          {/* 10. Settings View */}
          {currentView === 'settings' && (
            <SettingsView settings={settings} onSaveSettings={handleSaveSettings} />
          )}
        </main>
      </div>

      {/* Modals */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
        onAddInteraction={handleAddInteraction}
        onOpenMessageGeneratorForLead={handleOpenMessageGeneratorForLead}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        totalLeadsCount={leads.length}
        availableCities={Array.from(new Set(leads.map((l) => l.city || 'Брянск'))).sort()}
      />

      <AddLeadModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddLead={handleAddLead}
      />
    </div>
  );
}
