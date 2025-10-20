'use client';

import { useEffect, useState, useMemo } from 'react';
import { SpreadsheetGrid, GridColumn } from '../components/SpreadsheetGrid';
import { PanelLayout } from '../components/PanelLayout';
import { CampaignDetailsTabs } from '../components/CampaignDetailsTabs';
import { Megaphone } from 'lucide-react';
import { api } from '../services/api';

interface Campaign {
  id: string;
  name: string;
  valid_from: string | null;
  valid_to: string | null;
  status: string;
  created_at: string;
}

export function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await api.campaigns.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('sv-SE');
  };

  const columns = useMemo<GridColumn[]>(() => [
    {
      field: 'name',
      headerName: 'Kampanjnamn',
      width: 300,
      editable: true,
    },
    {
      field: 'valid_from',
      headerName: 'Giltighet från',
      width: 150,
      editable: true,
      type: 'date',
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: 'valid_to',
      headerName: 'Giltighet till',
      width: 150,
      editable: true,
      type: 'date',
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: 'id',
      headerName: 'Antal produkter',
      width: 150,
      type: 'number',
      editable: false,
      cellRenderer: () => '0',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      editable: false,
      fixed: true,
      cellRenderer: (value) => {
        const status = value;
        const labels: Record<string, string> = {
          active: 'Aktiv',
          planned: 'Planerad',
          expired: 'Utgången',
        };
        return labels[status] || status;
      },
    },
  ], []);

  const handleCellValueChanged = async (rowId: string, field: string, newValue: any) => {
    try {
      await api.campaigns.update(rowId, { [field]: newValue });

      setCampaigns(prev => prev.map(c =>
        c.id === rowId ? { ...c, [field]: newValue } : c
      ));
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handleCellClick = (row: Campaign, field: string) => {
    setSelectedCampaign(row);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600">Laddar kampanjer...</p>
        </div>
      </div>
    );
  }

  const mainPanel = (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Kampanjer</h1>
              <p className="text-sm text-slate-600">Hantera kampanjer och säsongsregler</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
              Ny kampanj
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <SpreadsheetGrid
          columns={columns}
          data={campaigns}
          height="calc(100vh - 180px)"
          onCellValueChanged={handleCellValueChanged}
          onCellClicked={handleCellClick}
        />
      </div>
    </div>
  );

  const detailsPanel = selectedCampaign && (
    <div className="flex flex-col h-full">
      {/* Campaign Info Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <div>
            <h3 className="text-xs font-medium text-slate-500">Kampanjnamn</h3>
            <p className="text-sm font-semibold text-slate-900">{selectedCampaign.name}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h3 className="text-xs font-medium text-slate-500">Giltighet från</h3>
              <p className="text-xs text-slate-900">{formatDate(selectedCampaign.valid_from)}</p>
            </div>
            <div>
              <h3 className="text-xs font-medium text-slate-500">Giltighet till</h3>
              <p className="text-xs text-slate-900">{formatDate(selectedCampaign.valid_to)}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500">Status</h3>
            <p className="text-xs text-slate-900">{selectedCampaign.status}</p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 overflow-hidden">
        <CampaignDetailsTabs
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
        />
      </div>
    </div>
  );

  return (
    <PanelLayout
      mainPanel={mainPanel}
      detailsPanel={detailsPanel}
      isDetailsOpen={isDetailsOpen}
      isBottomOpen={false}
      onCloseDetails={() => setIsDetailsOpen(false)}
      onCloseBottom={() => {}}
    />
  );
}
